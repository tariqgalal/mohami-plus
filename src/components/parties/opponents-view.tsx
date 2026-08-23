"use client";

import { useState } from "react";
import Link from "next/link";
import { Swords, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExportButton } from "@/components/shared/export-button";
import { SearchInput } from "@/components/shared/search-input";
import {
  useOpponents,
  useDeleteOpponent,
  type OpponentItem,
} from "@/hooks/use-opponents";
import { OPPONENT_STATUS } from "@/lib/constants";
import { toast } from "@/store/toast-store";
import type { OpponentFiltersInput } from "@/lib/validations/opponent-record";

const BASE_PATH = "/dashboard/parties/opponents";

const STATUS_VARIANTS: Record<string, "success" | "secondary"> = {
  ACTIVE: "success",
  ARCHIVED: "secondary",
};

export function OpponentsView() {
  const [filters, setFilters] = useState<Partial<OpponentFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "number",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useOpponents(filters);
  const deleteMutation = useDeleteOpponent();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الخصم");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف الخصم");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const hasFilters = !!(filters.q || filters.status);
  const startIndex = ((data?.page ?? 1) - 1) * (data?.limit ?? 20);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "إدارة الأطراف" },
          { label: "سجل الخصوم" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Swords className="size-7 text-brand-600" />
            سجل الخصوم
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            قاعدة بيانات موحّدة لخصوم المكتب عبر القضايا
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<OpponentItem>
            filename="opponents"
            columns={[
              { header: "الرقم", accessor: (r) => r.number },
              { header: "الاسم", accessor: (r) => r.name },
              { header: "رقم الهوية", accessor: (r) => r.idNumber ?? "" },
              { header: "رقم الجوال", accessor: (r) => r.phone ?? "" },
              { header: "البريد", accessor: (r) => r.email ?? "" },
              { header: "العنوان", accessor: (r) => r.address ?? "" },
              {
                header: "الحالة",
                accessor: (r) =>
                  (OPPONENT_STATUS as Record<string, string>)[r.status] ??
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
              const res = await fetch(`/api/opponents?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as OpponentItem[];
            }}
          />
          <Link href={`${BASE_PATH}/new`}>
            <Button>
              <Plus className="size-4" />
              خصم جديد
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.q ?? ""}
            onChange={(q) => setFilters({ ...filters, q, page: 1 })}
            placeholder="بحث بالاسم، رقم الهوية، الجوال، أو البريد..."
            className="lg:max-w-md flex-1"
          />
          <div className="flex flex-wrap gap-2">
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
              {Object.entries(OPPONENT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
        </div>
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
          icon={Swords}
          title={hasFilters ? "لا توجد نتائج" : "لا يوجد خصوم بعد"}
          description={
            hasFilters
              ? "جرّب تعديل عوامل التصفية"
              : "ابدأ بإضافة أول خصم في السجل"
          }
          action={
            !hasFilters && (
              <Link href={`${BASE_PATH}/new`}>
                <Button>
                  <Plus className="size-4" />
                  إضافة خصم
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
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">الرقم</th>
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">رقم الجوال</th>
                  <th className="px-4 py-3">البريد</th>
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
                    <td className="px-4 py-3 text-slate-700 font-medium tabular-nums">
                      {r.number}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`${BASE_PATH}/${r.id}`}
                        className="hover:text-brand-600"
                      >
                        {r.name}
                      </Link>
                      {r.idNumber && (
                        <p className="text-xs text-slate-500 font-mono">
                          {r.idNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums" dir="ltr">
                      {r.phone ? (
                        <span className="inline-block w-full text-right">
                          {r.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600" dir="ltr">
                      {r.email ? (
                        <span className="inline-block w-full text-right">
                          {r.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[r.status] ?? "secondary"}>
                        {(OPPONENT_STATUS as Record<string, string>)[r.status] ??
                          r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`${BASE_PATH}/${r.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`${BASE_PATH}/${r.id}/edit`}>
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
        title="حذف الخصم"
        description="سيتم حذف هذا الخصم نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
