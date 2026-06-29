import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublishableKey } from "@/lib/moyasar";
import { PublicPayClient } from "@/components/billing/public-pay-client";

export const metadata = { title: "دفع فاتورة الاشتراك — محامي بلس" };
export const dynamic = "force-dynamic";

export default async function PublicPayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invoice = await prisma.platformInvoice.findUnique({
    where: { publicToken: token },
    include: { tenant: { select: { name: true } } },
  });

  if (!invoice) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <PublicPayClient
          invoice={{
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            tenantName: invoice.tenant.name,
            plan: invoice.plan,
            baseAmount: invoice.baseAmount,
            vatAmount: invoice.vatAmount,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            periodStart: invoice.periodStart.toISOString(),
            periodEnd: invoice.periodEnd.toISOString(),
            currency: invoice.currency,
          }}
          publishableKey={
            invoice.status === "PENDING" ? getPublishableKey() : ""
          }
          callbackUrl={`${appUrl}/pay/${token}/done`}
        />
      </div>
    </div>
  );
}
