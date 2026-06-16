"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvoiceStatusBadge } from "@/components/finance/invoice-status-badge";
import { ExportButton } from "@/components/shared/export-button";
import {
  useInvoices,
  useDeleteInvoice,
  type InvoiceListItem,
} from "@/hooks/use-invoices";
import { INVOICE_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { InvoiceFiltersInput } from "@/lib/validations/invoice";

export default function InvoicesPage() {
  const [filters, setFilters] = useState<Partial<InvoiceFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useInvoices(filters);
  const deleteMutation = useDeleteInvoice();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الفاتورة");
      setConfirmId(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل الحذف";
      toast.error(msg);
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const hasFilters = !!(filters.q || filters.status);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المالية", href: "/dashboard/finance" },
          { label: "الفواتير" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الفواتير</h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة فواتير العملاء وتسجيل المدفوعات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<InvoiceListItem>
            filename="invoices"
            columns={[
              { header: "رقم الفاتورة", accessor: (r) => r.invoiceNumber },
              { header: "الوصف", accessor: (r) => r.description },
              { header: "العميل", accessor: (r) => r.client?.name ?? "" },
              { header: "القضية", accessor: (r) => r.case?.caseNumber ?? "" },
              {
                header: "المبلغ (ر.س)",
                accessor: (r) => Number(r.amount).toFixed(2),
              },
              {
                header: "الضريبة (ر.س)",
                accessor: (r) => Number(r.tax).toFixed(2),
              },
              {
                header: "الإجمالي (ر.س)",
                accessor: (r) => Number(r.totalAmount).toFixed(2),
              },
              {
                header: "المدفوع (ر.س)",
                accessor: (r) => Number(r.paidAmount).toFixed(2),
              },
              {
                header: "الحالة",
                accessor: (r) =>
                  (INVOICE_STATUS as Record<string, string>)[r.status] ??
                  r.status,
              },
              {
                header: "تاريخ الإصدار",
                accessor: (r) => formatDate(r.issueDate),
              },
              {
                header: "تاريخ الاستحقاق",
                accessor: (r) => formatDate(r.dueDate),
              },
              {
                header: "تاريخ الدفع",
                accessor: (r) => (r.paidDate ? formatDate(r.paidDate) : ""),
              },
            ]}
            fetcher={async () => {
              const params = new URLSearchParams({
                ...Object.fromEntries(
                  Object.entries(filters)
                    .filter(([, v]) => v !== undefined && v !== null && v !== "")
                    .map(([k, v]) => [k, String(v)]),
                ),
                page: "1",
                limit: "1000",
              });
              const res = await fetch(`/api/invoices?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as InvoiceListItem[];
            }}
          />
          <Link href="/dashboard/finance/invoices/new">
            <Button>
              <Plus className="size-4" />
              فاتورة جديدة
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.q ?? ""}
            onChange={(q) => setFilters({ ...filters, q, page: 1 })}
            placeholder="بحث برقم الفاتورة، الوصف، أو اسم العميل..."
            className="lg:max-w-md flex-1"
          />
          <Select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: (e.target.value || undefined) as never,
                page: 1,
              })
            }
            className="w-auto min-w-32"
          >
            <option value="">كل الحالات</option>
            {Object.entries(INVOICE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={5} cols={6} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {!isLoading && isEmpty && (
        <EmptyState
          icon={Receipt}
          title={hasFilters ? "لا توجد فواتير تطابق التصفية" : "لا توجد فواتير بعد"}
          description={
            hasFilters
              ? "جرّب تعديل عوامل التصفية"
              : "ابدأ بإنشاء أول فاتورة لأحد عملائك"
          }
          action={
            !hasFilters && (
              <Link href="/dashboard/finance/invoices/new">
                <Button>
                  <Plus className="size-4" />
                  فاتورة جديدة
                </Button>
              </Link>
            )
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                  <th className="px-4 py-3">رقم الفاتورة</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">الوصف</th>
                  <th className="px-4 py-3">الإجمالي</th>
                  <th className="px-4 py-3">المدفوع</th>
                  <th className="px-4 py-3">الاستحقاق</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/clients/${inv.client.id}`}
                        className="text-slate-900 hover:text-brand-600"
                      >
                        {inv.client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-slate-700 truncate">
                        {inv.description}
                      </p>
                      {inv.case && (
                        <p className="text-xs text-slate-500 font-mono truncate">
                          {inv.case.caseNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/finance/invoices/${inv.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/finance/invoices/${inv.id}/edit`}
                        >
                          <Button variant="ghost" size="icon" aria-label="تعديل">
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => setConfirmId(inv.id)}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="px-4 pb-4">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                limit={data.limit}
                onPageChange={(p) => setFilters({ ...filters, page: p })}
              />
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="حذف الفاتورة"
        description="هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع."
        confirmText="حذف"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
