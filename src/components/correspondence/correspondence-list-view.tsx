"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Plus, Eye, Trash2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import { CorrespondenceCategoryBadge } from "@/components/correspondence/correspondence-badges";
import {
  useCorrespondenceList,
  useDeleteCorrespondence,
} from "@/hooks/use-correspondence";
import { CORRESPONDENCE_CATEGORY } from "@/lib/constants";
import { toast } from "@/store/toast-store";
import type { CorrespondenceFiltersInput } from "@/lib/validations/correspondence";

const DIRECTION_TABS: { key: "INCOMING" | "OUTGOING"; label: string }[] = [
  { key: "INCOMING", label: "الواردة" },
  { key: "OUTGOING", label: "المرسلة" },
];

interface CorrespondenceListViewProps {
  type: "CLIENT" | "EMPLOYEE";
  title: string;
  subtitle: string;
}

export function CorrespondenceListView({
  type,
  title,
  subtitle,
}: CorrespondenceListViewProps) {
  const showSenderColumn = type === "EMPLOYEE";

  const [filters, setFilters] = useState<Partial<CorrespondenceFiltersInput>>({
    type,
    direction: "INCOMING",
    page: 1,
    limit: 20,
    sortBy: "date",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useCorrespondenceList(filters);
  const deleteMutation = useDeleteCorrespondence();

  const activeDirection = filters.direction ?? "INCOMING";
  const counts = data?.directionCounts ?? {};

  function setDirection(key: "INCOMING" | "OUTGOING") {
    setFilters((f) => ({ ...f, direction: key, page: 1 }));
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف المراسلة");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف المراسلة");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const colCount = showSenderColumn ? 7 : 6;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المراسلات" },
          { label: title },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <Link href={`/dashboard/correspondence/new?type=${type}`}>
          <Button>
            <Plus className="size-4" />
            مراسلة جديدة
          </Button>
        </Link>
      </div>

      {/* تابات الاتجاه: الواردة / المرسلة */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {DIRECTION_TABS.map((t) => {
          const active = activeDirection === t.key;
          const count = counts[t.key] ?? 0;
          return (
            <button
              key={t.key}
              onClick={() => setDirection(t.key)}
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

      {/* فلاتر */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">القسم:</span>
          <Select
            className="w-52"
            value={filters.category ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                category: (e.target.value ||
                  undefined) as CorrespondenceFiltersInput["category"],
                page: 1,
              }))
            }
          >
            <option value="">الكل</option>
            {Object.entries(CORRESPONDENCE_CATEGORY).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder="بحث في الموضوع..."
            value={filters.q ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                q: e.target.value || undefined,
                page: 1,
              }))
            }
          />
        </div>
      </div>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={6} cols={colCount} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={Mail}
          title="لا توجد مراسلات"
          description="ابدأ بإنشاء أول مراسلة"
          action={
            <Link href={`/dashboard/correspondence/new?type=${type}`}>
              <Button>
                <Plus className="size-4" />
                مراسلة جديدة
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
                  <th className="px-4 py-3">رقم المسلسل</th>
                  <th className="px-4 py-3">الموضوع</th>
                  {showSenderColumn && <th className="px-4 py-3">من</th>}
                  <th className="px-4 py-3">القسم</th>
                  <th className="px-4 py-3 text-center">المرفقات</th>
                  <th className="px-4 py-3">تاريخ الإرسال</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 tabular-nums font-mono">
                      {r.serialNumber}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/correspondence/${r.id}`}
                        className="text-slate-800 font-medium hover:text-brand-600"
                      >
                        {r.subject}
                      </Link>
                    </td>
                    {showSenderColumn && (
                      <td className="px-4 py-3 text-slate-700">
                        {r.senderName}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <CorrespondenceCategoryBadge category={r.category} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.attachmentCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-600 tabular-nums">
                          <Paperclip className="size-3.5" />
                          {r.attachmentCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={r.date} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/correspondence/${r.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
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
        title="حذف المراسلة"
        description="سيتم حذف هذه المراسلة وجميع ردودها نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
