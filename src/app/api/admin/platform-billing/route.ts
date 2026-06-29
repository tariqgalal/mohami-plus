import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();

    const [
      totalPaid,
      pendingCount,
      failedCount,
      recent,
      countsByStatus,
    ] = await Promise.all([
      prisma.platformInvoice.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.platformInvoice.count({ where: { status: "PENDING" } }),
      prisma.platformInvoice.count({ where: { status: "FAILED" } }),
      prisma.platformInvoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { tenant: { select: { name: true, email: true } } },
      }),
      prisma.subscription.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return apiSuccess({
      revenue: {
        totalPaidHalalat: totalPaid._sum.totalAmount ?? 0,
        paidInvoicesCount: totalPaid._count,
        pendingInvoicesCount: pendingCount,
        failedInvoicesCount: failedCount,
      },
      subscriptionsByStatus: countsByStatus.map((g) => ({
        status: g.status,
        count: g._count,
      })),
      recentInvoices: recent.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        tenant: { name: inv.tenant.name, email: inv.tenant.email },
        plan: inv.plan,
        totalAmount: inv.totalAmount,
        status: inv.status,
        createdAt: inv.createdAt,
        paidAt: inv.paidAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
