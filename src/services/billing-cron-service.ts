/**
 * المهام المجدولة للفوترة:
 *  1) تذكيرات قبل انتهاء التجربة (3 أيام قبل + يوم الانتهاء)
 *  2) إنهاء التجارب المنتهية بدون دفع → EXPIRED
 *  3) فواتير AUTO_RENEW: شحن التوكن في نهاية الفترة + إعادة المحاولات (0/3/7)
 *  4) فواتير MANUAL: إنشاء فاتورة جديدة + إرسال رابط دفع
 *  5) تعليق الاشتراكات المتجاوزة لفترة السماح (7 أيام)
 */

import { prisma } from "@/lib/prisma";
import {
  addDays,
  AUTO_RENEW_RETRY_SCHEDULE,
  nextAutoRenewAttemptAt,
} from "@/lib/billing";
import {
  createPendingInvoice,
  computeNewPeriod,
  computeGraceEnd,
  markInvoicePaidAndActivate,
  recordFailedAttempt,
} from "@/services/subscription-service";
import { chargeToken, isTokenizationEnabled } from "@/lib/moyasar";
import { sendEmail } from "@/lib/email";
import { buildInvoiceWhatsAppLink } from "@/lib/whatsapp";
import type { PlanKey } from "@/lib/constants";

export interface BillingCronReport {
  trialReminders: number;
  trialsExpired: number;
  autoRenewCharged: number;
  autoRenewFailed: number;
  manualInvoicesCreated: number;
  subscriptionsSuspended: number;
  errors: string[];
}

export async function runBillingCron(now: Date = new Date()): Promise<BillingCronReport> {
  const report: BillingCronReport = {
    trialReminders: 0,
    trialsExpired: 0,
    autoRenewCharged: 0,
    autoRenewFailed: 0,
    manualInvoicesCreated: 0,
    subscriptionsSuspended: 0,
    errors: [],
  };

  await sendTrialReminders(now, report).catch((e) => {
    report.errors.push(`trialReminders: ${msg(e)}`);
  });
  await expireOverdueTrials(now, report).catch((e) => {
    report.errors.push(`expireTrials: ${msg(e)}`);
  });
  await chargeDueAutoRenewals(now, report).catch((e) => {
    report.errors.push(`autoRenew: ${msg(e)}`);
  });
  await createDueManualInvoices(now, report).catch((e) => {
    report.errors.push(`manualInvoices: ${msg(e)}`);
  });
  await suspendExpiredSubscriptions(now, report).catch((e) => {
    report.errors.push(`suspend: ${msg(e)}`);
  });

  return report;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

// ============ 1) Trial reminders ============

async function sendTrialReminders(now: Date, report: BillingCronReport): Promise<void> {
  // نذكّر يومين قبل + يوم الانتهاء
  const window3DaysFrom = addDays(now, 3);
  const window3DaysTo = addDays(now, 4);
  const window1DayFrom = addDays(now, 1);
  const window1DayTo = addDays(now, 2);

  const subs = await prisma.subscription.findMany({
    where: {
      status: "TRIALING",
      OR: [
        { trialEndsAt: { gte: window3DaysFrom, lt: window3DaysTo } },
        { trialEndsAt: { gte: window1DayFrom, lt: window1DayTo } },
      ],
    },
    include: { tenant: { select: { email: true, name: true, phone: true } } },
  });

  for (const sub of subs) {
    if (!sub.trialEndsAt) continue;
    const daysLeft = Math.ceil(
      (sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendEmail({
      to: sub.tenant.email,
      subject: `تنبيه: تنتهي فترتك التجريبية خلال ${daysLeft} يوم`,
      html: `<div dir="rtl"><p>مرحباً ${sub.tenant.name},</p>
<p>تنتهي فترتك التجريبية في محامي بلس خلال <strong>${daysLeft}</strong> يوم. اشترك الآن للحفاظ على بياناتك وفريقك.</p>
<p><a href="${appUrl}/dashboard/billing">اختر باقتك الآن</a></p></div>`,
      text: `تنتهي فترتك التجريبية في محامي بلس خلال ${daysLeft} يوم. ${appUrl}/dashboard/billing`,
    });
    report.trialReminders++;
  }
}

// ============ 2) Expire overdue trials ============

async function expireOverdueTrials(now: Date, report: BillingCronReport): Promise<void> {
  const overdue = await prisma.subscription.findMany({
    where: { status: "TRIALING", trialEndsAt: { lt: now } },
  });

  for (const sub of overdue) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      }),
      prisma.tenant.update({
        where: { id: sub.tenantId },
        data: { status: "EXPIRED" },
      }),
    ]);
    report.trialsExpired++;
  }
}

// ============ 3) AUTO_RENEW: charge token at period end + retries ============

async function chargeDueAutoRenewals(now: Date, report: BillingCronReport): Promise<void> {
  if (!isTokenizationEnabled()) return; // الميزة معطّلة → تجاوز

  // (أ) اشتراكات نشطة وصلت لنهاية فترتها — أول محاولة خصم
  const dueRenewals = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      billingType: "AUTO_RENEW",
      moyasarTokenId: { not: null },
      currentPeriodEnd: { lte: now },
    },
    take: 50,
  });

  for (const sub of dueRenewals) {
    await attemptAutoRenewCharge(sub.id, now, report);
  }

  // (ب) محاولات إعادة لاشتراكات في PAST_DUE
  const retries = await prisma.subscription.findMany({
    where: {
      status: "PAST_DUE",
      billingType: "AUTO_RENEW",
      moyasarTokenId: { not: null },
      nextAttemptAt: { lte: now },
    },
    take: 50,
  });

  for (const sub of retries) {
    await attemptAutoRenewCharge(sub.id, now, report);
  }
}

async function attemptAutoRenewCharge(
  subscriptionId: string,
  now: Date,
  report: BillingCronReport,
): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { tenant: { select: { name: true, email: true } } },
  });
  if (!sub || !sub.moyasarTokenId) return;

  // نحتاج فاتورة PENDING للفترة الجديدة. لو ما فيش، أنشئ واحدة.
  let invoice = await prisma.platformInvoice.findFirst({
    where: {
      subscriptionId: sub.id,
      status: { in: ["PENDING", "FAILED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!invoice || invoice.status === "PAID") {
    const period = computeNewPeriod(now);
    const created = await createPendingInvoice({
      tenantId: sub.tenantId,
      subscriptionId: sub.id,
      plan: sub.plan as PlanKey,
      periodStart: period.start,
      periodEnd: period.end,
      dueDate: period.start,
      withPublicToken: false,
    });
    invoice = created.invoice;
  }

  try {
    const payment = await chargeToken({
      tokenId: sub.moyasarTokenId,
      amountHalalat: invoice.totalAmount,
      description: `تجديد اشتراك محامي بلس — ${invoice.invoiceNumber}`,
      metadata: {
        invoiceId: invoice.id,
        tenantId: sub.tenantId,
        subscriptionId: sub.id,
      },
    });

    if (payment.status === "paid") {
      await markInvoicePaidAndActivate({
        invoiceId: invoice.id,
        moyasarPaymentId: payment.id,
        paymentMethod: payment.source.type,
        paidAt: new Date(),
        cardToken: null, // نحتفظ بالموجود
      });
      await prisma.payment.create({
        data: {
          tenantId: sub.tenantId,
          subscriptionId: sub.id,
          platformInvoiceId: invoice.id,
          plan: invoice.plan,
          period: "monthly",
          amount: invoice.totalAmount / 100,
          amountHalalat: invoice.totalAmount,
          currency: invoice.currency,
          status: "paid",
          provider: "moyasar",
          providerRef: payment.id,
          moyasarPaymentId: payment.id,
          paymentMethod: payment.source.type,
        },
      });
      report.autoRenewCharged++;
    } else {
      throw new Error(
        payment.source?.message ?? `Moyasar status: ${payment.status}`,
      );
    }
  } catch (e) {
    const message = msg(e);
    const newFailedCount = sub.failedAttempts + 1;
    const lastAttempt = now;
    const nextAttempt = nextAutoRenewAttemptAt(newFailedCount, lastAttempt);

    await recordFailedAttempt({
      invoiceId: invoice.id,
      errorMessage: message,
      attemptedAt: lastAttempt,
    });

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "PAST_DUE",
        failedAttempts: newFailedCount,
        lastAttemptAt: lastAttempt,
        nextAttemptAt: nextAttempt,
        graceUntil:
          newFailedCount === 1 ? computeGraceEnd(lastAttempt) : sub.graceUntil,
      },
    });

    // إشعار العميل
    await sendEmail({
      to: sub.tenant.email,
      subject: "فشل تجديد اشتراكك في محامي بلس",
      html: `<div dir="rtl"><p>مرحباً ${sub.tenant.name},</p>
<p>تعذّر خصم رسوم تجديد اشتراكك. السبب: ${message}.</p>
<p>${
        newFailedCount < AUTO_RENEW_RETRY_SCHEDULE.maxAttempts
          ? "سنحاول مرة أخرى تلقائياً. حدّث بطاقتك من لوحة التحكم لتجنّب تعليق الاشتراك."
          : "وصلنا للحد الأقصى من المحاولات. سيتم تعليق الاشتراك إذا لم يُسدد قبل انتهاء فترة السماح."
      }</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/billing">إدارة الاشتراك</a></p></div>`,
      text: `فشل تجديد اشتراكك. ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/billing`,
    });

    report.autoRenewFailed++;
  }
}

// ============ 4) MANUAL invoices ============

async function createDueManualInvoices(now: Date, report: BillingCronReport): Promise<void> {
  // ننشئ فاتورة 3 أيام قبل نهاية الفترة الحالية
  const lookahead = addDays(now, 3);
  const subs = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      billingType: "MANUAL",
      currentPeriodEnd: { lte: lookahead, gte: now },
    },
    include: { tenant: { select: { name: true, email: true, phone: true } } },
  });

  for (const sub of subs) {
    // تأكد ما فيش فاتورة PENDING موجودة لنفس الفترة القادمة
    const existing = await prisma.platformInvoice.findFirst({
      where: {
        subscriptionId: sub.id,
        status: "PENDING",
        periodStart: { gte: sub.currentPeriodEnd ?? now },
      },
    });
    if (existing) continue;

    const period = computeNewPeriod(sub.currentPeriodEnd ?? now);
    const { invoice } = await createPendingInvoice({
      tenantId: sub.tenantId,
      subscriptionId: sub.id,
      plan: sub.plan as PlanKey,
      periodStart: period.start,
      periodEnd: period.end,
      dueDate: period.start,
      withPublicToken: true,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const payUrl = `${appUrl}/pay/${invoice.publicToken}`;
    const totalSar = (invoice.totalAmount / 100).toFixed(2);

    await sendEmail({
      to: sub.tenant.email,
      subject: `فاتورة اشتراك محامي بلس — ${invoice.invoiceNumber}`,
      html: `<div dir="rtl"><p>مرحباً ${sub.tenant.name},</p>
<p>تم إصدار فاتورة اشتراك جديدة بقيمة <strong>${totalSar} ر.س</strong> (شاملة الضريبة).</p>
<p>اضغط هنا لإتمام الدفع: <a href="${payUrl}">${payUrl}</a></p>
<p>الفاتورة مستحقة في ${period.start.toLocaleDateString("ar-SA")}.</p></div>`,
      text: `فاتورة محامي بلس ${invoice.invoiceNumber} بقيمة ${totalSar} ر.س. الدفع: ${payUrl}`,
    });

    if (sub.tenant.phone) {
      // wa.me link — للأرشيف فقط (مفيش API رسمي)
      buildInvoiceWhatsAppLink({
        clientPhone: sub.tenant.phone,
        firmName: "محامي بلس",
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount / 100,
        publicUrl: payUrl,
      });
    }

    await prisma.platformInvoice.update({
      where: { id: invoice.id },
      data: {
        sentAt: new Date(),
        sentToEmail: sub.tenant.email,
        sentToPhone: sub.tenant.phone ?? null,
      },
    });

    report.manualInvoicesCreated++;
  }
}

// ============ 5) Suspend expired grace periods ============

async function suspendExpiredSubscriptions(
  now: Date,
  report: BillingCronReport,
): Promise<void> {
  const expired = await prisma.subscription.findMany({
    where: {
      status: "PAST_DUE",
      graceUntil: { lte: now },
    },
  });

  for (const sub of expired) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      }),
      prisma.tenant.update({
        where: { id: sub.tenantId },
        data: { status: "SUSPENDED" },
      }),
    ]);
    report.subscriptionsSuspended++;
  }
}
