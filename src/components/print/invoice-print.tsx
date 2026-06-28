import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";

interface PrintTenant {
  name: string;
  licenseNumber: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string;
  logo: string | null;
}

interface PrintClient {
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string;
}

interface PrintPayment {
  id: string;
  amount: number | string;
  method: string;
  reference: string | null;
  paidAt: Date | string;
}

interface PrintInvoice {
  invoiceNumber: string;
  description: string;
  amount: number | string;
  tax: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  status: string;
  issueDate: Date | string;
  dueDate: Date | string;
  notes: string | null;
  case: { caseNumber: string; title: string } | null;
  payments: PrintPayment[];
}

interface InvoicePrintProps {
  tenant: PrintTenant;
  client: PrintClient;
  invoice: PrintInvoice;
  isPublic?: boolean;
}

export function InvoicePrint({
  tenant,
  client,
  invoice,
  isPublic = false,
}: InvoicePrintProps) {
  const outstanding =
    +(Number(invoice.totalAmount) - Number(invoice.paidAmount)).toFixed(2);

  return (
    <div dir="rtl" className="invoice-print mx-auto bg-white text-slate-900 p-10 max-w-[800px] print:max-w-none print:p-8 font-arabic">
      {/* Print-only style */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
          .invoice-print { box-shadow: none !important; }
          .no-print { display: none !important; }
        }
        .invoice-print { font-family: 'Tajawal','Cairo','IBM Plex Sans Arabic',system-ui,sans-serif; }
      `}</style>

      {/* Header */}
      <header className="flex items-start justify-between gap-6 pb-6 border-b-2 border-slate-200">
        <div className="flex-1">
          {tenant.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="h-16 w-auto mb-3 object-contain"
            />
          ) : (
            <div className="text-xl font-bold text-brand-700 mb-2">
              {tenant.name}
            </div>
          )}
          <p className="text-sm text-slate-600">{tenant.name}</p>
          {tenant.licenseNumber && (
            <p className="text-xs text-slate-500">
              رقم الترخيص: {tenant.licenseNumber}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {tenant.address ? `${tenant.address}، ` : ""}
            {tenant.city}
          </p>
          <p className="text-xs text-slate-500" dir="ltr">
            {tenant.phone || ""} · {tenant.email}
          </p>
        </div>

        <div className="text-left">
          <h1 className="text-2xl font-bold text-slate-900">فاتورة</h1>
          <p className="font-mono text-sm text-slate-700 mt-1">
            {invoice.invoiceNumber}
          </p>
          <div className="mt-3 text-xs space-y-1 text-slate-600">
            <p>
              <span className="font-medium text-slate-500">الإصدار: </span>
              {formatDate(invoice.issueDate)}
            </p>
            <p>
              <span className="font-medium text-slate-500">الاستحقاق: </span>
              {formatDate(invoice.dueDate)}
            </p>
            <p>
              <span className="font-medium text-slate-500">الحالة: </span>
              {statusLabel(invoice.status)}
            </p>
          </div>
        </div>
      </header>

      {/* Bill to + Case */}
      <section className="grid grid-cols-2 gap-6 my-6">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            فاتورة إلى
          </h2>
          <p className="font-semibold text-slate-900">{client.name}</p>
          <p className="text-sm text-slate-600" dir="ltr">
            {client.phone}
          </p>
          {client.email && (
            <p className="text-sm text-slate-600">{client.email}</p>
          )}
          {client.address && (
            <p className="text-sm text-slate-600">{client.address}</p>
          )}
          <p className="text-sm text-slate-600">{client.city}</p>
        </div>
        {invoice.case && (
          <div>
            <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
              القضية المرتبطة
            </h2>
            <p className="font-semibold text-slate-900">{invoice.case.title}</p>
            <p className="font-mono text-sm text-slate-600">
              {invoice.case.caseNumber}
            </p>
          </div>
        )}
      </section>

      {/* Line items table */}
      <section>
        <table className="w-full text-sm border-t border-b border-slate-200">
          <thead>
            <tr className="text-right text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="py-3 px-2 w-2/3">الوصف</th>
              <th className="py-3 px-2 text-left">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-4 px-2">{invoice.description}</td>
              <td className="py-4 px-2 text-left tabular-nums">
                {formatCurrency(invoice.amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <section className="flex justify-end mt-6">
        <div className="w-72 space-y-2 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-slate-600">المبلغ الفرعي</span>
            <span className="tabular-nums">{formatCurrency(invoice.amount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-600">ضريبة القيمة المضافة (15%)</span>
            <span className="tabular-nums">{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-slate-300 text-base font-bold">
            <span className="text-slate-900">الإجمالي</span>
            <span className="tabular-nums text-brand-700">
              {formatCurrency(invoice.totalAmount)}
            </span>
          </div>
          {Number(invoice.paidAmount) > 0 && (
            <>
              <div className="flex justify-between py-1 text-emerald-700">
                <span>المدفوع</span>
                <span className="tabular-nums">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 font-semibold">
                <span className="text-slate-900">المتبقي</span>
                <span className="tabular-nums text-amber-700">
                  {formatCurrency(outstanding)}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Notes */}
      {invoice.notes && (
        <section className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-md">
          <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            ملاحظات
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </section>
      )}

      {/* Payment history (only on private view) */}
      {!isPublic && invoice.payments.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            سجل المدفوعات
          </h3>
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-right text-slate-500 uppercase tracking-wide">
                <th className="py-2 px-2">التاريخ</th>
                <th className="py-2 px-2">الطريقة</th>
                <th className="py-2 px-2">المرجع</th>
                <th className="py-2 px-2 text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-2 px-2">{formatDate(p.paidAt)}</td>
                  <td className="py-2 px-2">
                    {(PAYMENT_METHODS as Record<string, string>)[p.method] ??
                      p.method}
                  </td>
                  <td className="py-2 px-2">{p.reference || "—"}</td>
                  <td className="py-2 px-2 text-left tabular-nums">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-10 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-6 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-700 mb-1">شروط الدفع</p>
            <p className="text-xs">
              يرجى سداد المبلغ المتبقي قبل تاريخ الاستحقاق المذكور أعلاه. يمكن
              السداد عبر التحويل البنكي أو مدى.
            </p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500">توقيع المكتب</p>
            <div className="h-16 border-b border-dashed border-slate-300 mt-6"></div>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          شكراً لتعاملكم مع {tenant.name}
        </p>
      </footer>
    </div>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "مسودة",
    SENT: "مرسلة",
    PAID: "مدفوعة",
    PARTIAL: "مدفوعة جزئياً",
    OVERDUE: "متأخرة",
    CANCELLED: "ملغاة",
  };
  return map[status] ?? status;
}
