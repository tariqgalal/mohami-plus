import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookPayload,
  MoyasarError,
  MoyasarConfigError,
  isTokenizationEnabled,
} from "@/lib/moyasar";
import {
  markInvoicePaidAndActivate,
  recordFailedAttempt,
} from "@/services/subscription-service";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Moyasar webhook receiver.
 *
 * Authenticity: Moyasar puts the `shared_secret` (configured at dashboard) inside
 * the JSON body as `secret_token`. We compare it timing-safely against
 * MOYASAR_WEBHOOK_SECRET — see verifyWebhookPayload().
 *
 * Idempotency: each event has a unique `id`. We store it in WebhookEvent;
 * duplicates short-circuit before doing any state mutation.
 *
 * Quick ACK: we return 2xx as fast as possible (Moyasar will retry on timeout).
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // === 1) Authenticity ===
  try {
    verifyWebhookPayload(raw);
  } catch (e) {
    if (e instanceof MoyasarConfigError) {
      console.error("[webhook] config error:", e.message);
      return NextResponse.json({ error: "config_error" }, { status: 500 });
    }
    if (e instanceof MoyasarError) {
      console.warn("[webhook] auth failed:", e.message);
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }

  // بعد verifyWebhookPayload فوق، نعرف إن الشكل صحيح
  const evt = raw as {
    id: string;
    type: string;
    data: { object: string; [k: string]: unknown };
  };

  // === 2) Idempotency check ===
  try {
    await prisma.webhookEvent.create({
      data: {
        moyasarEventId: evt.id,
        eventType: evt.type,
        payload: evt as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // duplicate event — already processed (or in flight). ACK immediately.
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[webhook] persist error:", err);
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }

  // === 3) Process ===
  try {
    await processEvent(evt);
    await prisma.webhookEvent.update({
      where: { moyasarEventId: evt.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhook] process error:", err);
    await prisma.webhookEvent
      .update({
        where: { moyasarEventId: evt.id },
        data: { status: "FAILED", error: message },
      })
      .catch(() => undefined);
    // نرجع 500 عشان Moyasar تعيد المحاولة لاحقاً
    return NextResponse.json({ error: "process_failed" }, { status: 500 });
  }
}

// ============ Event processors ============

interface MoyasarPaymentInWebhook {
  id: string;
  status: string;
  amount: number;
  source: {
    type: string;
    company?: string;
    number?: string;
    token?: string;
    message?: string;
  };
  metadata?: Record<string, string> | null;
}

async function processEvent(evt: {
  type: string;
  data: { object: string; [k: string]: unknown };
}): Promise<void> {
  switch (evt.type) {
    case "payment_paid":
      return handlePaymentPaid(evt.data as unknown as MoyasarPaymentInWebhook);
    case "payment_failed":
      return handlePaymentFailed(evt.data as unknown as MoyasarPaymentInWebhook);
    case "payment_refunded":
      return handlePaymentRefunded(evt.data as unknown as MoyasarPaymentInWebhook);
    default:
      console.log(`[webhook] unhandled event type: ${evt.type}`);
  }
}

function invoiceIdFromMetadata(p: MoyasarPaymentInWebhook): string | null {
  const fromMeta = p.metadata?.invoiceId;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  return null;
}

async function handlePaymentPaid(p: MoyasarPaymentInWebhook): Promise<void> {
  const invoiceId = invoiceIdFromMetadata(p);
  let invoice = null;

  if (invoiceId) {
    invoice = await prisma.platformInvoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: true },
    });
  }
  if (!invoice) {
    // ابحث بالـ moyasarPaymentId (لو verify الـ API سبقنا)
    invoice = await prisma.platformInvoice.findFirst({
      where: { moyasarPaymentId: p.id },
      include: { subscription: true },
    });
  }
  if (!invoice) {
    console.warn(`[webhook] payment_paid: no matching invoice for ${p.id}`);
    return;
  }

  // تحقق إضافي: المبلغ مطابق
  if (p.amount !== invoice.totalAmount) {
    throw new Error(
      `amount mismatch on payment ${p.id}: expected ${invoice.totalAmount}, got ${p.amount}`,
    );
  }

  const cardToken =
    invoice.subscription.billingType === "AUTO_RENEW" &&
    isTokenizationEnabled() &&
    p.source.token
      ? {
          tokenId: p.source.token,
          lastFour: (p.source.number ?? "").slice(-4).replace(/\D/g, "") || "----",
          brand: p.source.company ?? "unknown",
        }
      : null;

  const result = await markInvoicePaidAndActivate({
    invoiceId: invoice.id,
    moyasarPaymentId: p.id,
    paymentMethod: p.source.type,
    paidAt: new Date(),
    cardToken,
  });

  if (result.updated) {
    await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        subscriptionId: invoice.subscriptionId,
        platformInvoiceId: invoice.id,
        plan: invoice.plan,
        period: "monthly",
        amount: invoice.totalAmount / 100,
        amountHalalat: invoice.totalAmount,
        currency: invoice.currency,
        status: "paid",
        provider: "moyasar",
        providerRef: p.id,
        moyasarPaymentId: p.id,
        paymentMethod: p.source.type,
      },
    });
  }
}

async function handlePaymentFailed(p: MoyasarPaymentInWebhook): Promise<void> {
  const invoiceId = invoiceIdFromMetadata(p);
  if (!invoiceId) {
    console.warn(`[webhook] payment_failed: missing invoiceId in metadata for ${p.id}`);
    return;
  }
  await recordFailedAttempt({
    invoiceId,
    moyasarPaymentId: p.id,
    errorMessage: p.source.message ?? `payment ${p.status}`,
    attemptedAt: new Date(),
  });

  await prisma.payment.create({
    data: {
      tenantId: (
        await prisma.platformInvoice.findUniqueOrThrow({
          where: { id: invoiceId },
          select: { tenantId: true, subscriptionId: true, plan: true, totalAmount: true, currency: true },
        })
      ).tenantId,
      platformInvoiceId: invoiceId,
      plan: (
        await prisma.platformInvoice.findUniqueOrThrow({
          where: { id: invoiceId },
          select: { plan: true },
        })
      ).plan,
      period: "monthly",
      amount: p.amount / 100,
      amountHalalat: p.amount,
      currency: "SAR",
      status: "failed",
      provider: "moyasar",
      providerRef: p.id,
      moyasarPaymentId: p.id,
      paymentMethod: p.source.type,
      errorMessage: p.source.message ?? null,
    },
  }).catch((err) => {
    // لا نوقف معالجة الـ webhook لو الـ Payment log فشل
    console.error("[webhook] failed-payment log error:", err);
  });
}

async function handlePaymentRefunded(p: MoyasarPaymentInWebhook): Promise<void> {
  const invoice = await prisma.platformInvoice.findFirst({
    where: { moyasarPaymentId: p.id },
  });
  if (!invoice) {
    console.warn(`[webhook] refund: no matching invoice for ${p.id}`);
    return;
  }
  await prisma.platformInvoice.update({
    where: { id: invoice.id },
    data: { status: "REFUNDED" },
  });
}
