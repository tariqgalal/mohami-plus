"use client";

import { useState } from "react";
import Link from "next/link";
import { ListTodo, Plus, Eye, Edit, Trash2, Lock, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExportButton } from "@/components/shared/export-button";
import { SearchInput } from "@/components/shared/search-input";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskTimeDisplay } from "@/components/tasks/task-timer";
import {
  useTasks,
  useDeleteTask,
  type TaskItem,
} from "@/hooks/use-tasks";
import {
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_PROJECT_TYPE,
} from "@/lib/constants";
import { formatDuration, formatTaskNumber } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { TaskFiltersInput } from "@/lib/validations/task";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "PENDING", label: TASK_STATUS.PENDING },
  { key: "AWAITING_APPROVAL", label: TASK_STATUS.AWAITING_APPROVAL },
  { key: "COMPLETED", label: TASK_STATUS.COMPLETED },
  { key: "CANCELLED", label: TASK_STATUS.CANCELLED },
];

export default function TasksPage() {
  const [filters, setFilters] = useState<Partial<TaskFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useTasks(filters);
  const deleteMutation = useDeleteTask();

  const activeTab = (filters.status as string) ?? "";
  const counts = data?.statusCounts ?? {};
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  function setTab(key: string) {
    setFilters((f) => ({
      ...f,
      status: (key || undefined) as TaskFiltersInput["status"],
      page: 1,
    }));
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف المهمة");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف المهمة");
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
          { label: "المهام" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="size-7 text-brand-600" />
            المهام
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة مهام الفريق ومتابعة الوقت المستغرق والاعتماد
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/tasks/templates">
            <Button variant="outline">
              <Settings2 className="size-4" />
              الردود الجاهزة
            </Button>
          </Link>
          <ExportButton<TaskItem>
            filename="tasks"
            columns={[
              { header: "الرقم", accessor: (r) => formatTaskNumber(r.number) },
              { header: "العنوان", accessor: (r) => r.title },
              {
                header: "الأولوية",
                accessor: (r) =>
                  (TASK_PRIORITY as Record<string, string>)[r.priority] ??
                  r.priority,
              },
              {
                header: "نوع المشروع",
                accessor: (r) =>
                  (TASK_PROJECT_TYPE as Record<string, string>)[
                    r.projectType
                  ] ?? r.projectType,
              },
              { header: "العميل", accessor: (r) => r.clientName ?? "" },
              {
                header: "الوقت المستغرق",
                accessor: (r) => formatDuration(r.timeSpent),
              },
              {
                header: "المكلّفون",
                accessor: (r) =>
                  (r.assignedTo ?? []).map((a) => a.name).join("، "),
              },
              {
                header: "الحالة",
                accessor: (r) =>
                  (TASK_STATUS as Record<string, string>)[r.status] ?? r.status,
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
              const res = await fetch(`/api/tasks?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as TaskItem[];
            }}
          />
          <Link href="/dashboard/tasks/new">
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

      {/* فلاتر */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1 min-w-[200px]">
          <SearchInput
            placeholder="بحث بعنوان المهمة أو العميل..."
            value={filters.q ?? ""}
            onChange={(q) =>
              setFilters((f) => ({ ...f, q: q || undefined, page: 1 }))
            }
          />
        </div>
        <Select
          className="w-auto"
          value={filters.priority ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              priority: (e.target.value ||
                undefined) as TaskFiltersInput["priority"],
              page: 1,
            }))
          }
        >
          <option value="">كل الأولويات</option>
          {Object.entries(TASK_PRIORITY).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={filters.projectType ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              projectType: (e.target.value ||
                undefined) as TaskFiltersInput["projectType"],
              page: 1,
            }))
          }
        >
          <option value="">كل أنواع المشاريع</option>
          {Object.entries(TASK_PROJECT_TYPE).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
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
          icon={ListTodo}
          title="لا توجد مهام"
          description="ابدأ بإنشاء أول مهمة لفريقك"
          action={
            <Link href="/dashboard/tasks/new">
              <Button>
                <Plus className="size-4" />
                إضافة مهمة
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
                  <th className="px-4 py-3">الرقم</th>
                  <th className="px-4 py-3">العنوان</th>
                  <th className="px-4 py-3">الأولوية</th>
                  <th className="px-4 py-3">نوع المشروع</th>
                  <th className="px-4 py-3">الاستحقاق</th>
                  <th className="px-4 py-3">عداد الوقت</th>
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
                    <td className="px-4 py-3 text-slate-500 tabular-nums whitespace-nowrap">
                      {formatTaskNumber(r.number)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      <Link
                        href={`/dashboard/tasks/${r.id}`}
                        className="hover:text-brand-600 inline-flex items-center gap-1.5"
                      >
                        {r.isConfidential && (
                          <Lock className="size-3.5 text-amber-500" />
                        )}
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <TaskPriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(TASK_PROJECT_TYPE as Record<string, string>)[
                        r.projectType
                      ] ?? r.projectType}
                    </td>
                    <td className="px-4 py-3">
                      {r.dueDate ? (
                        <DualDateDisplay date={r.dueDate} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TaskTimeDisplay
                        timeSpent={r.timeSpent}
                        timerStartedAt={r.timerStartedAt}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <TaskStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/tasks/${r.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/tasks/${r.id}/edit`}>
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
        title="حذف المهمة"
        description="سيتم حذف هذه المهمة نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
