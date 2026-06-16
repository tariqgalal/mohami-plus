"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gavel,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  List as ListIcon,
  CheckCircle2,
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
import { SessionCalendar } from "@/components/sessions/session-calendar";
import {
  SessionStatusBadge,
  SessionTypeBadge,
} from "@/components/sessions/session-status-badge";
import { RecordResultDialog } from "@/components/sessions/record-result-dialog";
import {
  useSessions,
  useDeleteSession,
} from "@/hooks/use-sessions";
import { useTeam } from "@/hooks/use-team";
import { COURTS, SESSION_STATUS, SESSION_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { SessionFiltersInput } from "@/lib/validations/session";

export default function SessionsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [filters, setFilters] = useState<Partial<SessionFiltersInput>>({
    page: 1,
    limit: 50,
    sortBy: "date",
    sortDir: "asc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  // عند تبديل العرض للتقويم، نضبط نطاق الشهر
  const calendarFilters: Partial<SessionFiltersInput> = (() => {
    if (view !== "calendar") return filters;
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59);
    return { ...filters, from, to, view: "calendar", limit: 500 };
  })();

  const { data, isLoading, isError, error } = useSessions(calendarFilters);
  const { data: team } = useTeam();
  const deleteMutation = useDeleteSession();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الجلسة");
      setConfirmId(null);
    } catch (e: any) {
      toast.error(e.message || "فشل حذف الجلسة");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const hasFilters = !!(
    filters.q ||
    filters.status ||
    filters.sessionType ||
    filters.lawyerId ||
    filters.court
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الجلسات" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الجلسات</h1>
          <p className="text-sm text-slate-500 mt-1">
            جدول جلسات المحاكم — قائمة وتقويم
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-md flex">
            <button
              onClick={() => setView("list")}
              className={cn(
                "px-3 py-1.5 text-xs rounded flex items-center gap-1.5 transition-colors",
                view === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <ListIcon className="size-3.5" />
              قائمة
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "px-3 py-1.5 text-xs rounded flex items-center gap-1.5 transition-colors",
                view === "calendar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <CalendarIcon className="size-3.5" />
              تقويم
            </button>
          </div>
          <Link href="/dashboard/sessions/new">
            <Button>
              <Plus className="size-4" />
              جلسة جديدة
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.q ?? ""}
            onChange={(q) => setFilters({ ...filters, q, page: 1 })}
            placeholder="بحث برقم القضية، العنوان، أو المحكمة..."
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
              {Object.entries(SESSION_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select
              value={filters.sessionType ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sessionType: (e.target.value || undefined) as never,
                  page: 1,
                })
              }
              className="w-auto min-w-32"
            >
              <option value="">كل الأنواع</option>
              {Object.entries(SESSION_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select
              value={filters.lawyerId ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  lawyerId: e.target.value || undefined,
                  page: 1,
                })
              }
              className="w-auto min-w-32"
            >
              <option value="">كل المحامين</option>
              {team?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
            <Select
              value={filters.court ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  court: e.target.value || undefined,
                  page: 1,
                })
              }
              className="w-auto min-w-32"
            >
              <option value="">كل المحاكم</option>
              {COURTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
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

      {!isLoading && view === "calendar" && (
        <SessionCalendar
          sessions={items}
          month={month}
          onMonthChange={setMonth}
        />
      )}

      {!isLoading && view === "list" && isEmpty && (
        <EmptyState
          icon={Gavel}
          title={hasFilters ? "لا توجد جلسات تطابق التصفية" : "لا توجد جلسات بعد"}
          description={
            hasFilters
              ? "جرّب تعديل عوامل التصفية"
              : "ابدأ بجدولة أول جلسة لإحدى قضاياك"
          }
          action={
            !hasFilters && (
              <Link href="/dashboard/sessions/new">
                <Button>
                  <Plus className="size-4" />
                  جدولة جلسة
                </Button>
              </Link>
            )
          }
        />
      )}

      {!isLoading && view === "list" && items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">القضية</th>
                  <th className="px-4 py-3">المحكمة</th>
                  <th className="px-4 py-3">المحامي</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {formatDate(s.date)}
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {s.time}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <Link
                        href={`/dashboard/cases/${s.case.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600 truncate block"
                      >
                        {s.case.title}
                      </Link>
                      <p className="text-xs text-slate-500 font-mono">
                        {s.case.caseNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{s.court}</p>
                      {s.hall && (
                        <p className="text-xs text-slate-500">{s.hall}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {s.lawyer.name}
                    </td>
                    <td className="px-4 py-3">
                      <SessionTypeBadge type={s.sessionType} />
                    </td>
                    <td className="px-4 py-3">
                      <SessionStatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {s.status === "SCHEDULED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="تسجيل نتيجة"
                            onClick={() => setResultId(s.id)}
                          >
                            <CheckCircle2 className="size-4 text-emerald-600" />
                          </Button>
                        )}
                        <Link href={`/dashboard/sessions/${s.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/sessions/${s.id}/edit`}>
                          <Button variant="ghost" size="icon" aria-label="تعديل">
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => setConfirmId(s.id)}
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
        title="حذف الجلسة"
        description="هل أنت متأكد من حذف هذه الجلسة؟ لا يمكن التراجع."
        confirmText="حذف"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {resultId && (
        <RecordResultDialog
          sessionId={resultId}
          open={!!resultId}
          onOpenChange={(o) => !o && setResultId(null)}
        />
      )}
    </div>
  );
}
