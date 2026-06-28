import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvoicePrint } from "@/components/print/invoice-print";
import { PrintToolbar } from "@/components/print/print-toolbar";

interface Props {
  params: Promise<{ token: string }>;
}

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: Props) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  // Token is the unique key — no auth, no tenant filter (the token IS the auth)
  const inv = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: {
      client: true,
      case: { select: { caseNumber: true, title: true } },
      tenant: {
        select: {
          name: true,
          licenseNumber: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          logo: true,
        },
      },
    },
  });
  if (!inv) notFound();

  return (
    <>
      <PrintToolbar invoiceNumber={inv.invoiceNumber} />
      <InvoicePrint
        isPublic
        tenant={{
          name: inv.tenant.name,
          licenseNumber: inv.tenant.licenseNumber,
          email: inv.tenant.email,
          phone: inv.tenant.phone,
          address: inv.tenant.address,
          city: inv.tenant.city,
          logo: inv.tenant.logo,
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
          // Public view intentionally hides internal notes:
          notes: null,
          case: inv.case,
          payments: [],
        }}
      />
    </>
  );
}
