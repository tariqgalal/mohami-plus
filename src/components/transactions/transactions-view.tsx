"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExportButton } from "@/components/shared/export-button";
import { SearchInput } from "@/components/shared/search-input";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import {
  useTransactions,
  useDeleteTransaction,
  type TransactionItem,
} from "@/hooks/use-transactions";
import { formatHijri, formatGregorianShort } from "@/lib/hijri";
import { toast } from "@/store/toast-store";
import type { TransactionFiltersInput } from "@/lib/validations/transaction";

interface TransactionsViewProps {
  direction: "INCOMING" | "OUTGOING";
}

export function TransactionsView({ direction }: TransactionsViewProps) {
  const isIncoming = direction === "INCOMING";
  const title = isIncoming ? "الوارد" : "الصادر";
  const basePath = isIncoming
    ? "/dashboard/transactions/incoming"
    : "/dashboard/transactions/outgoing";
  const dateColLabel = isIncoming ? "تاريخ الاستلام" : "تاريخ الإرسال";
  const partyColLabel = isIncoming ? "المرسِل" : "المستلِم";

  const [filters, setFilters] = useState<Partial<TransactionFiltersInput>>({
    page: 1,
    limit: 20,
    direction,
    sortBy: isIncoming ? "receiveDate" : "sendDate",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useTransactions(filters);
  const deleteMutation = useDeleteTransaction();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف المعاملة");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف المعاملة");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const startIndex = ((data?.page ?? 1) - 1) * (data?.limit ?? 20);

  const dateOf = (t: TransactionItem) =>
    isIncoming ? t.receiveDate : t.sendDate;
  const partyOf = (t: TransactionItem) =>
    isIncoming ? t.senderName : t.recipientName;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المعاملات" },
          { label: title },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="size-7 text-brand-600" />
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isIncoming
              ? "سجل المعاملات الرسمية الواردة إلى المكتب"
              : "سجل المعاملات الرسمية الصادرة من المكتب"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<TransactionItem>
            filename={isIncoming ? "incoming-transactions" : "outgoing-transactions"}
            columns={[
              { header: "رقم القيد", accessor: (r) => r.registryNumber },
              { header: "موضوع المعاملة", accessor: (r) => r.subject },
              {
                header: dateColLabel,
                accessor: (r) => {
                  const d = dateOf(r);
                  return d ? `${formatHijri(d)} هـ / ${formatGregorianShort(d)}` : "";
                },
              },
              { header: partyColLabel, accessor: (r) => partyOf(r) ?? "" },
              { header: "القسم", accessor: (r) => r.department ?? "" },
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
              const res = await fetch(`/api/transactions?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as TransactionItem[];
            }}
          />
          <Link href={`${basePath}/new`}>
            <Button>
              <Plus className="size-4" />
              إضافة
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-sm">
        <SearchInput
          placeholder="بحث برقم القيد أو الموضوع..."
          value={filters.q ?? ""}
          onChange={(q) => setFilters((f) => ({ ...f, q: q || undefined, page: 1 }))}
        />
      </div>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={6} cols={5} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={FileText}
          title="لا توجد معاملات"
          description={
            isIncoming
              ? "ابدأ بتسجيل أول معاملة واردة"
              : "ابدأ بتسجيل أول معاملة صادرة"
          }
          action={
            <Link href={`${basePath}/new`}>
              <Button>
                <Plus className="size-4" />
                إضافة معاملة
              </Button>
            </Link>
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">رقم القيد</th>
                  <th className="px-4 py-3">موضوع المعاملة</th>
                  <th className="px-4 py-3">{dateColLabel}</th>
                  <th className="px-4 py-3">{partyColLabel}</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                      {startIndex + i + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium tabular-nums">
                      {r.registryNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {r.subject}
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={dateOf(r)} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {partyOf(r) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`${basePath}/${r.id}/edit`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`${basePath}/${r.id}/edit`}>
                          <Button variant="ghost" size="icon" aria-label="تعديل">
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => setConfirmId(r.id)}
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
        title="حذف المعاملة"
        description="سيتم حذف هذه المعاملة نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
