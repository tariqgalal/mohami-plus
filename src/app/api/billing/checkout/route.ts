import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  getOrCreateSubscription,
  createPendingInvoice,
  updateBillingType,
  computeNewPeriod,
} from "@/services/subscription-service";
import { prisma } from "@/lib/prisma";
import { getPublishableKey, isTokenizationEnabled } from "@/lib/moyasar";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  plan: z.enum(["BASIC", "PROFESSIONAL", "ENTERPRISE"]),
  billingType: z.enum(["AUTO_RENEW", "MANUAL"]),
});

export async function POST(req: NextRequest) {
  try {
    // فقط مدير المكتب يقدر يبدأ الاشتراك / الترقية
    await requirePermission("BILLING_MANAGE");
    const tenantId = await getTenantId();

    const body = await req.json();
    const { plan, billingType } = checkoutSchema.parse(body);

    // لو AUTO_RENEW مطلوب وTokenization معطّل → ارفض
    if (billingType === "AUTO_RENEW" && !isTokenizationEnabled()) {
      return apiError(
        "ميزة التجديد التلقائي غير متاحة حالياً. يرجى اختيار الفوترة اليدوية.",
        400,
      );
    }

    const sub = await getOrCreateSubscription(tenantId);
    await updateBillingType(sub.id, billingType);

    const period = computeNewPeriod(new Date());
    const { invoice } = await createPendingInvoice({
      tenantId,
      subscriptionId: sub.id,
      plan,
      periodStart: period.start,
      periodEnd: period.end,
      // فاتورة الترقية المباشرة مستحقة فوراً
      dueDate: period.start,
      withPublicToken: false,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const callbackUrl = `${appUrl}/dashboard/billing/callback?invoiceId=${invoice.id}`;

    return apiSuccess({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      publishableKey: getPublishableKey(),
      amountHalalat: invoice.totalAmount,
      baseAmount: invoice.baseAmount,
      vatAmount: invoice.vatAmount,
      currency: invoice.currency,
      description: `اشتراك محامي بلس — باقة ${plan}`,
      callbackUrl,
      saveCard: billingType === "AUTO_RENEW",
      metadata: {
        invoiceId: invoice.id,
        tenantId,
        subscriptionId: sub.id,
        plan,
        billingType,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  // مفيد للتشخيص: يرجع آخر فاتورة PENDING
  try {
    const tenantId = await getTenantId();
    const pending = await prisma.platformInvoice.findFirst({
      where: { tenantId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(pending);
  } catch (error) {
    return handleApiError(error);
  }
}
