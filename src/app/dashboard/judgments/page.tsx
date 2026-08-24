"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, Plus, Eye, Edit, Trash2 } from "lucide-react";
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
  ObjectionStatusBadge,
  JudgmentResultBadge,
  JudgmentLevelBadge,
} from "@/components/judgments/judgment-badges";
import {
  useJudgments,
  useDeleteJudgment,
  type JudgmentItem,
} from "@/hooks/use-judgments";
import {
  OBJECTION_STATUS,
  JUDGMENT_LEVEL,
  JUDGMENT_RESULT,
} from "@/lib/constants";
import { formatHijri, formatGregorianShort } from "@/lib/hijri";
import { toast } from "@/store/toast-store";
import type { JudgmentFiltersInput } from "@/lib/validations/judgment";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "PRE_FILING", label: OBJECTION_STATUS.PRE_FILING },
  { key: "NO_OBJECTION", label: OBJECTION_STATUS.NO_OBJECTION },
  { key: "PENDING", label: OBJECTION_STATUS.PENDING },
  { key: "OBJECTED", label: OBJECTION_STATUS.OBJECTED },
];

export default function JudgmentsPage() {
  const [filters, setFilters] = useState<Partial<JudgmentFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "receiveDate",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useJudgments(filters);
  const deleteMutation = useDeleteJudgment();

  const activeTab = (filters.objectionStatus as string) ?? "";
  const counts = data?.objectionCounts ?? {};
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  function setTab(key: string) {
    setFilters((f) => ({
      ...f,
      objectionStatus: (key || undefined) as JudgmentFiltersInput["objectionStatus"],
      page: 1,
    }));
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الحكم");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف الحكم");
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
          { label: "الأحكام" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="size-7 text-brand-600" />
            الأحكام
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            متابعة الأحكام الصادرة في القضايا ومهل الاعتراض عليها
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<JudgmentItem>
            filename="judgments"
            columns={[
              { header: "رقم القضية", accessor: (r) => r.caseNumber },
              { header: "اسم القضية", accessor: (r) => r.caseTitle },
              {
                header: "درجة الترافع",
                accessor: (r) =>
                  (JUDGMENT_LEVEL as Record<string, string>)[r.judgmentLevel] ??
                  r.judgmentLevel,
              },
              {
                header: "نتيجة الحكم",
                accessor: (r) =>
                  (JUDGMENT_RESULT as Record<string, string>)[
                    r.judgmentResult
                  ] ?? r.judgmentResult,
              },
              { header: "ملخص الحكم", accessor: (r) => r.judgmentSummary ?? "" },
              {
                header: "تاريخ استلام الحكم",
                accessor: (r) =>
                  r.receiveDate
                    ? `${formatHijri(r.receiveDate)} هـ / ${formatGregorianShort(r.receiveDate)}`
                    : "",
              },
              {
                header: "حالة الاعتراض",
                accessor: (r) =>
                  (OBJECTION_STATUS as Record<string, string>)[
                    r.objectionStatus
                  ] ?? r.objectionStatus,
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
              const res = await fetch(`/api/judgments?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as JudgmentItem[];
            }}
          />
          <Link href="/dashboard/judgments/new">
            <Button>
              <Plus className="size-4" />
              إضافة
            </Button>
          </Link>
        </div>
      </div>

      {/* تابات حالة الاعتراض */}
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
          placeholder="بحث برقم أو اسم القضية..."
          value={filters.q ?? ""}
          onChange={(q) =>
            setFilters((f) => ({ ...f, q: q || undefined, page: 1 }))
          }
        />
      </div>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={6} cols={6} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={Scale}
          title="لا توجد أحكام"
          description="ابدأ بتسجيل أول حكم مرتبط بقضية"
          action={
            <Link href="/dashboard/judgments/new">
              <Button>
                <Plus className="size-4" />
                إضافة حكم
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
                  <th className="px-4 py-3">اسم القضية</th>
                  <th className="px-4 py-3">درجة الترافع</th>
                  <th className="px-4 py-3">نتيجة الحكم</th>
                  <th className="px-4 py-3">ملخص نص الحكم</th>
                  <th className="px-4 py-3">تاريخ استلام آخر حكم</th>
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
                        href={`/dashboard/cases/${r.caseId}`}
                        className="hover:text-brand-600"
                      >
                        {r.caseTitle}
                      </Link>
                      <div className="text-xs text-slate-400 tabular-nums">
                        {r.caseNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <JudgmentLevelBadge level={r.judgmentLevel} />
                    </td>
                    <td className="px-4 py-3">
                      <JudgmentResultBadge result={r.judgmentResult} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {r.judgmentSummary ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={r.receiveDate} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/judgments/${r.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/judgments/${r.id}/edit`}>
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
        title="حذف الحكم"
        description="سيتم حذف هذا الحكم نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
