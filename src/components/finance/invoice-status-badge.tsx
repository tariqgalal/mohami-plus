import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS } from "@/lib/constants";
import type { InvoiceStatus } from "@prisma/client";

const variants: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  SENT: "bg-blue-50 text-blue-700 ring-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  OVERDUE: "bg-red-50 text-red-700 ring-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus | string }) {
  const cls = variants[status as InvoiceStatus] ?? variants.DRAFT;
  return (
    <Badge className={`${cls} ring-1`}>
      {INVOICE_STATUS[status as InvoiceStatus] ?? status}
    </Badge>
  );
}
