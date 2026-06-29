/**
 * خدمة إدارة اشتراكات المنصة (للمكاتب) — Subscription + PlatformInvoice.
 *
 * **مهم**: كل التعاملات هنا server-side فقط. لا تستدعى من client components.
 */

import { prisma } from "@/lib/prisma";
import {
  computePlanPrice,
  allocateInvoiceNumber,
  addMonths,
  addDays,
  generatePublicToken,
  type PriceBreakdown,
} from "@/lib/billing";
import { PLANS, type PlanKey } from "@/lib/constants";
import type {
  Subscription,
  PlatformInvoice,
  BillingType,
  Plan,
  Prisma,
} from "@prisma/client";

const PLAN_LIMITS: Record<PlanKey, { maxUsers: number; maxCases: number; maxStorage: number }> = {
  BASIC: { maxUsers: PLANS.BASIC.maxUsers, maxCases: PLANS.BASIC.maxCases, maxStorage: PLANS.BASIC.maxStorage },
  PROFESSIONAL: { maxUsers: PLANS.PROFESSIONAL.maxUsers, maxCases: PLANS.PROFESSIONAL.maxCases, maxStorage: PLANS.PROFESSIONAL.maxStorage },
  ENTERPRISE: { maxUsers: PLANS.ENTERPRISE.maxUsers, maxCases: PLANS.ENTERPRISE.maxCases, maxStorage: PLANS.ENTERPRISE.maxStorage },
};

/**
 * يجيب الاشتراك الحالي للمكتب — ينشئه لو مش موجود (يعتمد على بيانات Tenant القديمة).
 */
export async function getOrCreateSubscription(
  tenantId: string,
): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({ where: { tenantId } });
  if (existing) return existing;

  // إنشاء من بيانات Tenant الحالية (هجرة سلسلة)
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      plan: true,
      status: true,
      trialEndsAt: true,
      subscriptionStart: true,
      subscriptionEnd: true,
    },
  });

  const mappedStatus =
    tenant.status === "TRIAL"
      ? "TRIALING"
      : tenant.status === "ACTIVE"
        ? "ACTIVE"
        : tenant.status === "EXPIRED" || tenant.status === "CANCELLED"
          ? "EXPIRED"
          : "TRIALING";

  return prisma.subscription.create({
    data: {
      tenantId,
      plan: tenant.plan,
      status: mappedStatus,
      billingType: "MANUAL",
      trialEndsAt: tenant.trialEndsAt,
      currentPeriodStart: tenant.subscriptionStart,
      currentPeriodEnd: tenant.subscriptionEnd,
    },
  });
}

/**
 * ينشئ فاتورة PENDING جديدة لاشتراك معيّن.
 * يولّد رقم فاتورة فريد ويحسب الضريبة.
 */
export async function createPendingInvoice(params: {
  tenantId: string;
  subscriptionId: string;
  plan: PlanKey;
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
  withPublicToken?: boolean;
}): Promise<{ invoice: PlatformInvoice; price: PriceBreakdown }> {
  const price = computePlanPrice(params.plan);
  const dueDate = params.dueDate ?? params.periodStart;

  const invoice = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await allocateInvoiceNumber(tx);
    return tx.platformInvoice.create({
      data: {
        invoiceNumber,
        tenantId: params.tenantId,
        subscriptionId: params.subscriptionId,
        plan: params.plan as Plan,
        baseAmount: price.baseAmount,
        vatAmount: price.vatAmount,
        totalAmount: price.totalAmount,
        vatRate: price.vatRateBps,
        currency: "SAR",
        status: "PENDING",
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        dueDate,
        publicToken: params.withPublicToken ? generatePublicToken() : null,
      },
    });
  });

  return { invoice, price };
}

/**
 * يحدّث فاتورة لـ PAID ويفعّل الاشتراك. يستخدم transaction للسلامة.
 *
 * @returns true إذا تم التحديث، false إذا الفاتورة كانت PAID قبل كده (idempotent).
 */
export async function markInvoicePaidAndActivate(params: {
  invoiceId: string;
  moyasarPaymentId: string;
  paymentMethod: string;
  paidAt: Date;
  cardToken?: { tokenId: string; lastFour: string; brand: string } | null;
}): Promise<{ updated: boolean; subscriptionId: string; tenantId: string }> {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.platformInvoice.findUnique({
      where: { id: params.invoiceId },
      include: { subscription: true },
    });
    if (!invoice) throw new Error(`الفاتورة غير موجودة: ${params.invoiceId}`);

    if (invoice.status === "PAID") {
      return {
        updated: false,
        subscriptionId: invoice.subscriptionId,
        tenantId: invoice.tenantId,
      };
    }

    const sub = invoice.subscription;
    const planKey = invoice.plan as PlanKey;
    const limits = PLAN_LIMITS[planKey];

    // فترة الاشتراك الجديدة: من تاريخ الفاتورة لمدة شهر
    const newStart = invoice.periodStart;
    const newEnd = invoice.periodEnd;

    await tx.platformInvoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        moyasarPaymentId: params.moyasarPaymentId,
        paymentMethod: params.paymentMethod,
        paidAt: params.paidAt,
      },
    });

    await tx.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        plan: invoice.plan,
        currentPeriodStart: newStart,
        currentPeriodEnd: newEnd,
        graceUntil: null,
        failedAttempts: 0,
        lastAttemptAt: params.paidAt,
        nextAttemptAt: null,
        // حفظ التوكن لو متاح (AUTO_RENEW)
        ...(params.cardToken
          ? {
              moyasarTokenId: params.cardToken.tokenId,
              cardLastFour: params.cardToken.lastFour,
              cardBrand: params.cardToken.brand,
            }
          : {}),
      },
    });

    // تحديث Tenant — الحقول القديمة (للتوافق مع باقي الكود)
    await tx.tenant.update({
      where: { id: invoice.tenantId },
      data: {
        plan: invoice.plan,
        status: "ACTIVE",
        subscriptionStart: newStart,
        subscriptionEnd: newEnd,
        maxUsers: limits.maxUsers,
        maxCases: limits.maxCases,
        maxStorage: BigInt(limits.maxStorage),
        monthlyPrice: PLANS[planKey].price,
      },
    });

    return {
      updated: true,
      subscriptionId: sub.id,
      tenantId: invoice.tenantId,
    };
  });
}

/**
 * يسجّل محاولة دفع فاشلة. يستخدم في حالة Moyasar ترجع failed.
 */
export async function recordFailedAttempt(params: {
  invoiceId: string;
  moyasarPaymentId?: string;
  errorMessage: string;
  attemptedAt: Date;
}): Promise<void> {
  await prisma.platformInvoice.update({
    where: { id: params.invoiceId },
    data: {
      status: "FAILED",
      moyasarPaymentId: params.moyasarPaymentId,
      metadata: {
        lastError: params.errorMessage,
        lastAttemptAt: params.attemptedAt.toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export function planLimits(plan: PlanKey) {
  return PLAN_LIMITS[plan];
}

/**
 * يحدّث نوع الفوترة (AUTO_RENEW / MANUAL) لاشتراك.
 */
export async function updateBillingType(
  subscriptionId: string,
  billingType: BillingType,
): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      billingType,
      // لو رجع MANUAL، نمسح التوكن المحفوظ
      ...(billingType === "MANUAL"
        ? { moyasarTokenId: null, cardLastFour: null, cardBrand: null }
        : {}),
    },
  });
}

/**
 * يبدأ فترة جديدة للاشتراك (مفيد لـ AUTO_RENEW عند الخصم التلقائي).
 */
export function computeNewPeriod(from: Date = new Date()): {
  start: Date;
  end: Date;
} {
  return { start: from, end: addMonths(from, 1) };
}

/**
 * يحسب موعد انتهاء فترة السماح (7 أيام بعد تاريخ معيّن).
 */
export function computeGraceEnd(from: Date): Date {
  return addDays(from, 7);
}
