"use client";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  plan: string;
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELED";
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
  publicToken: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<InvoiceRow["status"], string> = {
  PENDING: "مستحقة",
  PAID: "مدفوعة",
  FAILED: "فشل الدفع",
  REFUNDED: "مستردة",
  CANCELED: "ملغاة",
};

const STATUS_STYLES: Record<InvoiceRow["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-red-50 text-red-700 ring-red-200",
  REFUNDED: "bg-violet-50 text-violet-700 ring-violet-200",
  CANCELED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const sar = (h: number) => (h / 100).toFixed(2);

export function InvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <div className="text-sm text-slate-500 text-center py-6">
        لا توجد فواتير بعد. ستظهر فواتير اشتراكك هنا بعد أول دفعة.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-slate-500 border-b">
          <tr>
            <th className="text-right px-6 py-2 font-medium">رقم الفاتورة</th>
            <th className="text-right px-3 py-2 font-medium">الفترة</th>
            <th className="text-right px-3 py-2 font-medium">المبلغ</th>
            <th className="text-right px-3 py-2 font-medium">الحالة</th>
            <th className="text-right px-6 py-2 font-medium">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b last:border-0 hover:bg-slate-50/50">
              <td className="px-6 py-3">
                <span className="font-medium tabular-nums">{inv.invoiceNumber}</span>
              </td>
              <td className="px-3 py-3 text-slate-600">
                {formatDate(inv.periodStart)} → {formatDate(inv.periodEnd)}
              </td>
              <td className="px-3 py-3">
                <div className="font-medium tabular-nums">{sar(inv.totalAmount)} ر.س</div>
                <div className="text-xs text-slate-400 tabular-nums">
                  {sar(inv.baseAmount)} + ضريبة {sar(inv.vatAmount)}
                </div>
              </td>
              <td className="px-3 py-3">
                <Badge className={`${STATUS_STYLES[inv.status]} ring-1`}>
                  {STATUS_LABELS[inv.status]}
                </Badge>
              </td>
              <td className="px-6 py-3">
                {inv.status === "PENDING" && inv.publicToken && (
                  <a
                    href={`/pay/${inv.publicToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline text-xs font-medium"
                  >
                    دفع الفاتورة ←
                  </a>
                )}
                {inv.status === "PAID" && inv.paidAt && (
                  <span className="text-xs text-slate-500">
                    دُفعت في {formatDate(inv.paidAt)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
