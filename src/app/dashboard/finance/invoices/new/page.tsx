import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { InvoiceForm } from "@/components/finance/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المالية", href: "/dashboard/finance" },
          { label: "الفواتير", href: "/dashboard/finance/invoices" },
          { label: "فاتورة جديدة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">فاتورة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          إصدار فاتورة جديدة لعميل مع ضريبة القيمة المضافة
        </p>
      </div>
      <InvoiceForm mode="create" />
    </div>
  );
}
