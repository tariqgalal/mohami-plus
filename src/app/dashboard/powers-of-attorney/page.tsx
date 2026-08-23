"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExportButton } from "@/components/shared/export-button";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import {
  PoaStatusBadge,
  DaysRemainingCell,
  daysRemaining,
} from "@/components/powers-of-attorney/poa-status-badge";
import {
  usePowersOfAttorney,
  useDeletePowerOfAttorney,
  type PoaListItem,
} from "@/hooks/use-powers-of-attorney";
import { POA_STATUS } from "@/lib/constants";
import { formatHijri, formatGregorianShort } from "@/lib/hijri";
import { toast } from "@/store/toast-store";
import type { PowerOfAttorneyFiltersInput } from "@/lib/validations/power-of-attorney";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "ACTIVE", label: POA_STATUS.ACTIVE },
  { key: "EXPIRED", label: POA_STATUS.EXPIRED },
  { key: "PARTIALLY_REVOKED", label: POA_STATUS.PARTIALLY_REVOKED },
  { key: "FULLY_REVOKED", label: POA_STATUS.FULLY_REVOKED },
];

export default function PowersOfAttorneyPage() {
  const [filters, setFilters] = useState<Partial<PowerOfAttorneyFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "endDate",
    sortDir: "asc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = usePowersOfAttorney(filters);
  const deleteMutation = useDeletePowerOfAttorney();

  const activeTab = (filters.status as string) ?? "";
  const counts = data?.statusCounts ?? {};
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  function setTab(key: string) {
    setFilters((f) => ({
      ...f,
      status: (key || undefined) as PowerOfAttorneyFiltersInput["status"],
      page: 1,
    }));
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الوكالة");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف الوكالة");
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
          { label: "الوكالات" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الوكالات</h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة الوكالات القانونية ومتابعة صلاحيتها والأيام المتبقية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<PoaListItem>
            filename="powers-of-attorney"
            columns={[
              { header: "رقم الوكالة", accessor: (r) => r.number },
              { header: "العميل", accessor: (r) => r.client?.name ?? "" },
              { header: "تاريخ البداية (هجري)", accessor: (r) => r.startDateHijri || formatHijri(r.startDate) },
              { header: "تاريخ البداية (ميلادي)", accessor: (r) => formatGregorianShort(r.startDate) },
              { header: "تاريخ الانتهاء (هجري)", accessor: (r) => r.endDateHijri || formatHijri(r.endDate) },
              { header: "تاريخ الانتهاء (ميلادي)", accessor: (r) => formatGregorianShort(r.endDate) },
              { header: "الأيام المتبقية", accessor: (r) => daysRemaining(r.endDate) },
              {
                header: "الحالة",
                accessor: (r) =>
                  (POA_STATUS as Record<string, string>)[r.status] ?? r.status,
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
              const res = await fetch(`/api/powers-of-attorney?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as PoaListItem[];
            }}
          />
          <Link href="/dashboard/powers-of-attorney/new">
            <Button>
              <Plus className="size-4" />
              وكالة جديدة
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
          icon={ShieldCheck}
          title="لا توجد وكالات"
          description="ابدأ بإضافة أول وكالة قانونية لمكتبك"
          action={
            <Link href="/dashboard/powers-of-attorney/new">
              <Button>
                <Plus className="size-4" />
                إضافة وكالة
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
                  <th className="px-4 py-3">رقم الوكالة</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">تاريخ البداية</th>
                  <th className="px-4 py-3">تاريخ الانتهاء</th>
                  <th className="px-4 py-3">الأيام المتبقية</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                      {startIndex + i + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      <Link
                        href={`/dashboard/powers-of-attorney/${p.id}`}
                        className="hover:text-brand-600"
                      >
                        {p.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {p.client?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={p.startDate} />
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={p.endDate} />
                    </td>
                    <td className="px-4 py-3">
                      <DaysRemainingCell endDate={p.endDate} />
                    </td>
                    <td className="px-4 py-3">
                      <PoaStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/powers-of-attorney/${p.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/powers-of-attorney/${p.id}/edit`}
                        >
                          <Button variant="ghost" size="icon" aria-label="تعديل">
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => setConfirmId(p.id)}
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
        title="حذف الوكالة"
        description="سيتم حذف هذه الوكالة نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
