import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicPayDoneClient } from "@/components/billing/public-pay-done-client";

export const metadata = { title: "نتيجة الدفع — محامي بلس" };
export const dynamic = "force-dynamic";

export default async function PublicPayDonePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await prisma.platformInvoice.findUnique({
    where: { publicToken: token },
    select: { id: true, invoiceNumber: true },
  });
  if (!invoice) notFound();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <PublicPayDoneClient invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
      </div>
    </div>
  );
}
