import { notFound } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { getInvoice } from "@/services/invoice-service";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { InvoiceForm } from "@/components/finance/invoice-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const inv = await getInvoice(tenantId, id);
  if (!inv) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المالية", href: "/dashboard/finance" },
          { label: "الفواتير", href: "/dashboard/finance/invoices" },
          { label: inv.invoiceNumber, href: `/dashboard/finance/invoices/${id}` },
          { label: "تعديل" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الفاتورة</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {inv.invoiceNumber}
        </p>
      </div>
      <InvoiceForm
        mode="edit"
        initial={{
          id: inv.id,
          clientId: inv.clientId,
          caseId: inv.caseId,
          description: inv.description,
          amount: Number(inv.amount),
          taxIncluded: Number(inv.tax) > 0,
          dueDate: inv.dueDate.toISOString().slice(0, 10) as never,
          notes: inv.notes,
          status: inv.status,
        }}
      />
    </div>
  );
}
