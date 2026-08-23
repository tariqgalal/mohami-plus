"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Eye, Edit, Trash2 } from "lucide-react";
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
import { BorrowingStatusBadge } from "@/components/borrowings/borrowing-status-badge";
import {
  useBorrowings,
  useDeleteBorrowing,
  type BorrowingItem,
} from "@/hooks/use-borrowings";
import { BORROWING_STATUS } from "@/lib/constants";
import { formatHijri, formatGregorianShort } from "@/lib/hijri";
import { toast } from "@/store/toast-store";
import type { BorrowingFiltersInput } from "@/lib/validations/borrowing";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "PENDING", label: BORROWING_STATUS.PENDING },
  { key: "DELIVERED", label: BORROWING_STATUS.DELIVERED },
  { key: "RETURNED", label: BORROWING_STATUS.RETURNED },
  { key: "REJECTED", label: BORROWING_STATUS.REJECTED },
];

export default function BorrowingsPage() {
  const [filters, setFilters] = useState<Partial<BorrowingFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "borrowDate",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useBorrowings(filters);
  const deleteMutation = useDeleteBorrowing();

  const activeTab = (filters.status as string) ?? "";
  const counts = data?.statusCounts ?? {};
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  function setTab(key: string) {
    setFilters((f) => ({
      ...f,
      status: (key || undefined) as BorrowingFiltersInput["status"],
      page: 1,
    }));
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الاستعارة");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف الاستعارة");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const startIndex = ((data?.page ?? 1) - 1) * (data?.limit ?? 20);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاستعارات" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="size-7 text-brand-600" />
            الاستعارات
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            متابعة استعارة وثائق المكتب من قِبل الموظفين وإرجاعها
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<BorrowingItem>
            filename="borrowings"
            columns={[
              { header: "الموظف", accessor: (r) => r.employeeName },
              { header: "مصدر الوثيقة", accessor: (r) => r.documentSource },
              { header: "نوع الوثيقة", accessor: (r) => r.documentType },
              { header: "الاسم/الرقم", accessor: (r) => r.documentName },
              { header: "الوصف", accessor: (r) => r.description ?? "" },
              {
                header: "تاريخ الاستعارة",
                accessor: (r) =>
                  `${formatHijri(r.borrowDate)} هـ / ${formatGregorianShort(r.borrowDate)}`,
              },
              {
                header: "الحالة",
                accessor: (r) =>
                  (BORROWING_STATUS as Record<string, string>)[r.status] ??
                  r.status,
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
              const res = await fetch(`/api/borrowings?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as BorrowingItem[];
            }}
          />
          <Link href="/dashboard/borrowings/new">
            <Button>
              <Plus className="size-4" />
              إضافة
            </Button>
          </Link>
        </div>
      </div>

      {/* تابات الحالة */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const count = t.key === "" ? totalCount : counts[t.key] ?? 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap -mb-px border-b-2 ${
                active
                  ? "text-brand-700 border-brand-600"
                  : "text-slate-600 hover:text-slate-900 border-transparent"
              }`}
            >
              {t.label}
              <span className="ms-2 text-xs text-slate-400 tabular-nums">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="max-w-sm">
        <SearchInput
          placeholder="بحث بالموظف أو الوثيقة..."
          value={filters.q ?? ""}
          onChange={(q) =>
            setFilters((f) => ({ ...f, q: q || undefined, page: 1 }))
          }
        />
      </div>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={6} cols={7} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={BookOpen}
          title="لا توجد استعارات"
          description="ابدأ بتسجيل أول استعارة وثيقة"
          action={
            <Link href="/dashboard/borrowings/new">
              <Button>
                <Plus className="size-4" />
                إضافة استعارة
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
                  <th className="px-4 py-3">الموظف</th>
                  <th className="px-4 py-3">مصدر الوثيقة</th>
                  <th className="px-4 py-3">نوع الوثيقة</th>
                  <th className="px-4 py-3">الاسم/الرقم</th>
                  <th className="px-4 py-3">الوصف</th>
                  <th className="px-4 py-3">تاريخ الاستعارة</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                      {startIndex + i + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      <Link
                        href={`/dashboard/borrowings/${r.id}`}
                        className="hover:text-brand-600"
                      >
                        {r.employeeName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.documentSource}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.documentType}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.documentName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {r.description ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={r.borrowDate} />
                    </td>
                    <td className="px-4 py-3">
                      <BorrowingStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/borrowings/${r.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/borrowings/${r.id}/edit`}>
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
        title="حذف الاستعارة"
        description="سيتم حذف هذه الاستعارة نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
