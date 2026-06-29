import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { verifyPayment, isTokenizationEnabled } from "@/lib/moyasar";
import {
  markInvoicePaidAndActivate,
  recordFailedAttempt,
} from "@/services/subscription-service";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  invoiceId: z.string().min(1),
  moyasarPaymentId: z.string().min(1),
});

/**
 * يتأكّد من الدفع من السيرفر مباشرة عبر Moyasar API.
 * لا يعتمد إطلاقاً على رد الواجهة الأمامية.
 *
 * يستخدم في:
 * 1) صفحة callback بعد الدفع المباشر داخل /dashboard/billing
 * 2) صفحة الدفع العامة /pay/[token] للفواتير اليدوية
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, moyasarPaymentId } = verifySchema.parse(body);

    // التأكد إن الفاتورة موجودة وتنتمي للمكتب (لو في session)
    const invoice = await prisma.platformInvoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: true },
    });
    if (!invoice) return apiError("الفاتورة غير موجودة", 404);

    // اختياري: لو في session، نتأكد إن المكتب مطابق
    try {
      const tenantId = await getTenantId();
      if (tenantId !== invoice.tenantId) {
        return apiError("غير مصرح", 403);
      }
    } catch {
      // في حالة الفاتورة المدفوعة من رابط عام (publicToken)
      // مفيش session — نسمح بالتحقق لو الفاتورة فيها token
      if (!invoice.publicToken) {
        return apiError("غير مصرح", 401);
      }
    }

    // لو الفاتورة مدفوعة قبل كده، نرجع نجاح (idempotent)
    if (invoice.status === "PAID") {
      return apiSuccess({
        status: "PAID",
        invoiceNumber: invoice.invoiceNumber,
        alreadyPaid: true,
      });
    }

    // التأكد من حالة الدفع الفعلية من Moyasar (السيرفر فقط)
    const payment = await verifyPayment(moyasarPaymentId);

    if (payment.status !== "paid") {
      await recordFailedAttempt({
        invoiceId: invoice.id,
        moyasarPaymentId: payment.id,
        errorMessage: payment.source?.message ?? `حالة الدفع: ${payment.status}`,
        attemptedAt: new Date(),
      });
      return apiError(
        `الدفع لم يكتمل. الحالة من البوابة: ${payment.status}`,
        402,
        { moyasarStatus: payment.status, message: payment.source?.message },
      );
    }

    // التحقق من المبلغ مطابق (حماية من العبث)
    if (payment.amount !== invoice.totalAmount) {
      return apiError(
        `قيمة الدفع غير مطابقة للفاتورة (متوقع ${invoice.totalAmount} هللة، استُلم ${payment.amount}).`,
        409,
      );
    }

    // التقاط التوكن لو AUTO_RENEW وTokenization مفعّل
    const cardToken =
      invoice.subscription.billingType === "AUTO_RENEW" &&
      isTokenizationEnabled() &&
      payment.source.token
        ? {
            tokenId: payment.source.token,
            lastFour:
              (payment.source.number ?? "").slice(-4).replace(/\D/g, "") ||
              "----",
            brand: payment.source.company ?? "unknown",
          }
        : null;

    const result = await markInvoicePaidAndActivate({
      invoiceId: invoice.id,
      moyasarPaymentId: payment.id,
      paymentMethod: payment.source.type,
      paidAt: new Date(),
      cardToken,
    });

    // سجل في جدول Payment للتدقيق
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
        providerRef: payment.id,
        moyasarPaymentId: payment.id,
        paymentMethod: payment.source.type,
      },
    });

    return apiSuccess({
      status: "PAID",
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: result.subscriptionId,
      alreadyPaid: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
