"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import {
  CaseStatusBadge,
  PriorityBadge,
} from "@/components/cases/case-status-badge";
import { useCases, useArchiveCase } from "@/hooks/use-cases";
import { CASE_TYPES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { CaseFiltersInput } from "@/lib/validations/case";

export default function CasesArchivePage() {
  const [filters, setFilters] = useState<Partial<CaseFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "updatedAt",
    sortDir: "desc",
    archived: true,
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useCases(filters);
  const archiveMutation = useArchiveCase();

  async function handleRestore() {
    if (!confirmId) return;
    try {
      await archiveMutation.mutateAsync({ id: confirmId, archived: false });
      toast.success("تمت استعادة القضية من الأرشيف");
      setConfirmId(null);
    } catch (e: any) {
      toast.error(e.message || "فشل استعادة القضية");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "القضايا", href: "/dashboard/cases" },
          { label: "الأرشيف" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">أرشيف القضايا</h1>
          <p className="text-sm text-slate-500 mt-1">
            القضايا المؤرشفة — يمكنك استعادتها في أي وقت
          </p>
        </div>
        <Link href="/dashboard/cases">
          <Button variant="outline">
            <ArrowRight className="size-4" />
            العودة للقضايا
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <SearchInput
          value={filters.q ?? ""}
          onChange={(q) => setFilters({ ...filters, q, page: 1 })}
          placeholder="بحث في الأرشيف برقم القضية أو العنوان أو العميل..."
          className="max-w-md"
        />
      </Card>

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
          icon={Archive}
          title="الأرشيف فارغ"
          description="لا توجد قضايا مؤرشفة حالياً"
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
                  <th className="px-4 py-3">القيمة</th>
                  <th className="px-4 py-3">الأولوية</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
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
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="استعادة"
                          onClick={() => setConfirmId(c.id)}
                        >
                          <ArchiveRestore className="size-4 text-emerald-600" />
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
        title="استعادة القضية"
        description="سيتم إرجاع القضية إلى القائمة الرئيسية."
        confirmText="استعادة"
        loading={archiveMutation.isPending}
        onConfirm={handleRestore}
      />
    </div>
  );
}
