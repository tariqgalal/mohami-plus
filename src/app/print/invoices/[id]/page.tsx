import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoice } from "@/services/invoice-service";
import { InvoicePrint } from "@/components/print/invoice-print";
import { PrintToolbar } from "@/components/print/print-toolbar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrintInvoicePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) notFound();

  const inv = await getInvoice(session.user.tenantId, id);
  if (!inv) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      name: true,
      licenseNumber: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      logo: true,
    },
  });
  if (!tenant) notFound();

  // Honor ?download=1 — Tip the title so browser PDF save uses invoice number
  const h = await headers();
  const downloadMode = h.get("x-print-download") === "1";

  return (
    <>
      <PrintToolbar
        invoiceNumber={inv.invoiceNumber}
        autoDownload={downloadMode}
      />
      <InvoicePrint
        tenant={{
          name: tenant.name,
          licenseNumber: tenant.licenseNumber,
          email: tenant.email,
          phone: tenant.phone,
          address: tenant.address,
          city: tenant.city,
          logo: tenant.logo,
        }}
        client={{
          name: inv.client.name,
          phone: inv.client.phone,
          email: inv.client.email,
          address: inv.client.address,
          city: inv.client.city,
        }}
        invoice={{
          invoiceNumber: inv.invoiceNumber,
          description: inv.description,
          amount: Number(inv.amount),
          tax: Number(inv.tax),
          totalAmount: Number(inv.totalAmount),
          paidAmount: Number(inv.paidAmount),
          status: inv.status,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          notes: inv.notes,
          case: inv.case
            ? { caseNumber: inv.case.caseNumber, title: inv.case.title }
            : null,
          payments: inv.payments.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            method: p.method,
            reference: p.reference,
            paidAt: p.paidAt,
          })),
        }}
      />
    </>
  );
}
