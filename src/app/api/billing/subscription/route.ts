import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { getOrCreateSubscription } from "@/services/subscription-service";
import { prisma } from "@/lib/prisma";
import { isTokenizationEnabled } from "@/lib/moyasar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenantId = await getTenantId();
    const sub = await getOrCreateSubscription(tenantId);

    const recentInvoices = await prisma.platformInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        invoiceNumber: true,
        plan: true,
        baseAmount: true,
        vatAmount: true,
        totalAmount: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        dueDate: true,
        paidAt: true,
        paymentMethod: true,
        publicToken: true,
        createdAt: true,
      },
    });

    return apiSuccess({
      subscription: {
        id: sub.id,
        plan: sub.plan,
        status: sub.status,
        billingType: sub.billingType,
        trialEndsAt: sub.trialEndsAt,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        graceUntil: sub.graceUntil,
        cardLastFour: sub.cardLastFour,
        cardBrand: sub.cardBrand,
        canceledAt: sub.canceledAt,
      },
      invoices: recentInvoices,
      tokenizationEnabled: isTokenizationEnabled(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
