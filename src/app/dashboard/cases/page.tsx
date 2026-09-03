"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Plus, Eye, Edit, Archive, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CaseFilters } from "@/components/cases/case-filters";
import { CaseStatusTabs } from "@/components/cases/case-status-tabs";
import {
  CaseStatusBadge,
  PriorityBadge,
} from "@/components/cases/case-status-badge";
import { ExportButton } from "@/components/shared/export-button";
import {
  useCases,
  useCaseCounts,
  useArchiveCase,
  type CaseListItem,
} from "@/hooks/use-cases";
import {
  CASE_TYPES,
  CASE_STATUS,
  CASE_STATUS_ALL,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { CaseFiltersInput } from "@/lib/validations/case";

export default function CasesPage() {
  const [filters, setFilters] = useState<Partial<CaseFiltersInput>>(() => {
    const base: Partial<CaseFiltersInput> = {
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDir: "desc",
    };
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const caseType = sp.get("caseType");
      const status = sp.get("status");
      if (caseType) base.caseType = caseType as never;
      if (status) base.status = status as never;
    }
    return base;
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useCases(filters);
  const { data: countsData } = useCaseCounts();
  const archiveMutation = useArchiveCase();

  async function handleArchive() {
    if (!confirmId) return;
    try {
      await archiveMutation.mutateAsync({ id: confirmId, archived: true });
      toast.success("تم نقل القضية إلى الأرشيف");
      setConfirmId(null);
    } catch (e: any) {
      toast.error(e.message || "فشل أرشفة القضية");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const hasFilters = !!(filters.q || filters.status || filters.caseType || filters.priority);

  // نوضّح للمستخدم بالضبط أي فلاتر شغّالة لما النتيجة تطلع فاضية، بدل رسالة
  // "لا توجد نتائج" المجرّدة اللي بتبان وكأنها عطل في الفلترة.
  const activeFilterLabels: string[] = [];
  if (filters.q) activeFilterLabels.push(`بحث: "${filters.q}"`);
  if (filters.status)
    activeFilterLabels.push(
      `الحالة: ${(CASE_STATUS as Record<string, string>)[filters.status] ?? filters.status}`,
    );
  if (filters.caseType)
    activeFilterLabels.push(
      `النوع: ${(CASE_TYPES as Record<string, string>)[filters.caseType] ?? filters.caseType}`,
    );
  if (filters.priority)
    activeFilterLabels.push(
      `الأولوية: ${(PRIORITY_LABELS as Record<string, string>)[filters.priority] ?? filters.priority}`,
    );

  function clearFilters() {
    setFilters({
      page: 1,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    });
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "القضايا" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">القضايا</h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة جميع قضايا المكتب — البحث، الفلترة، والمتابعة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<CaseListItem>
            filename="cases"
            columns={[
              { header: "رقم القضية", accessor: (r) => r.caseNumber },
              { header: "العنوان", accessor: (r) => r.title },
              { header: "العميل", accessor: (r) => r.client?.name ?? "" },
              {
                header: "النوع",
                accessor: (r) =>
                  (CASE_TYPES as Record<string, string>)[r.caseType] ?? r.caseType,
              },
              { header: "المحكمة", accessor: (r) => r.court },
              {
                header: "المحامي الرئيسي",
                accessor: (r) =>
                  r.lawyers.find((l) => l.isPrimary)?.user.name ?? "",
              },
              {
                header: "القيمة (ر.س)",
                accessor: (r) => (r.value ? Number(r.value).toFixed(2) : ""),
              },
              {
                header: "الأولوية",
                accessor: (r) =>
                  (PRIORITY_LABELS as Record<string, string>)[r.priority] ??
                  r.priority,
              },
              {
                header: "الحالة",
                accessor: (r) =>
                  (CASE_STATUS_ALL as Record<string, string>)[r.status] ??
                  r.status,
              },
              {
                header: "تاريخ الإنشاء",
                accessor: (r) => formatDate(r.createdAt),
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
              const res = await fetch(`/api/cases?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as CaseListItem[];
            }}
          />
          <Link href="/dashboard/cases/archive">
            <Button variant="outline">
              <Archive className="size-4" />
              الأرشيف
            </Button>
          </Link>
          <Link href="/dashboard/cases/new">
            <Button>
              <Plus className="size-4" />
              قضية جديدة
            </Button>
          </Link>
        </div>
      </div>

      <CaseStatusTabs
        value={filters.status}
        counts={countsData?.counts ?? {}}
        total={countsData?.total ?? 0}
        onChange={(status) =>
          setFilters((f) => ({ ...f, status: status as never, page: 1 }))
        }
      />

      <Card className="p-4">
        <CaseFilters value={filters} onChange={setFilters} />
      </Card>

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
          icon={Briefcase}
          title={hasFilters ? "لا توجد قضايا مطابقة" : "لا توجد قضايا بعد"}
          description={
            hasFilters
              ? `لا توجد قضايا تطابق (${activeFilterLabels.join("، ")}). امسح عوامل التصفية لعرض كل القضايا.`
              : "ابدأ بإضافة أول قضية لمكتبك"
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                <X className="size-4" />
                مسح عوامل التصفية
              </Button>
            ) : (
              <Link href="/dashboard/cases/new">
                <Button>
                  <Plus className="size-4" />
                  إضافة قضية
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
                  <th className="px-4 py-3">رقم القضية</th>
                  <th className="px-4 py-3">العنوان</th>
                  <th className="px-4 py-3">العميل</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">المحامي</th>
                  <th className="px-4 py-3">القيمة</th>
                  <th className="px-4 py-3">الأولوية</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => {
                  const primary = c.lawyers.find((l) => l.isPrimary);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                        {c.caseNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-[260px] truncate">
                        <Link
                          href={`/dashboard/cases/${c.id}`}
                          className="hover:text-brand-600"
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{c.client.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {(CASE_TYPES as Record<string, string>)[c.caseType]}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {primary?.user.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">
                        {c.value ? formatCurrency(c.value) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <CaseStatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/dashboard/cases/${c.id}`}>
                            <Button variant="ghost" size="icon" aria-label="عرض">
                              <Eye className="size-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/cases/${c.id}/edit`}>
                            <Button variant="ghost" size="icon" aria-label="تعديل">
                              <Edit className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="أرشفة"
                            onClick={() => setConfirmId(c.id)}
                          >
                            <Archive className="size-4 text-amber-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
        title="أرشفة القضية"
        description="سيتم نقل القضية إلى الأرشيف وإخفاؤها من القائمة الرئيسية. يمكنك استعادتها لاحقاً من صفحة الأرشيف."
        confirmText="أرشفة"
        loading={archiveMutation.isPending}
        onConfirm={handleArchive}
      />
    </div>
  );
}
