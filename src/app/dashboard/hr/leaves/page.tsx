"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarOff, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExportButton } from "@/components/shared/export-button";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import { LeaveStatusBadge, LeaveTypeBadge } from "@/components/hr/leave-badges";
import {
  useEmployeeLeaves,
  useDeleteEmployeeLeave,
  type EmployeeLeaveItem,
} from "@/hooks/use-employee-leaves";
import { LEAVE_TYPE, LEAVE_STATUS } from "@/lib/constants";
import { formatHijri, formatGregorianShort } from "@/lib/hijri";
import { toast } from "@/store/toast-store";
import type { EmployeeLeaveFiltersInput } from "@/lib/validations/employee-leave";

export default function LeavesPage() {
  const [filters, setFilters] = useState<Partial<EmployeeLeaveFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "startDate",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useEmployeeLeaves(filters);
  const deleteMutation = useDeleteEmployeeLeave();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الإجازة");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف الإجازة");
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
          { label: "الموارد البشرية" },
          { label: "سجل الإجازات" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarOff className="size-7 text-brand-600" />
            سجل الإجازات
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            تسجيل ومتابعة إجازات الموظفين
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<EmployeeLeaveItem>
            filename="employee-leaves"
            columns={[
              { header: "اسم الموظف", accessor: (r) => r.employeeName },
              {
                header: "نوع الإجازة",
                accessor: (r) =>
                  (LEAVE_TYPE as Record<string, string>)[r.leaveType] ??
                  r.leaveType,
              },
              {
                header: "من",
                accessor: (r) =>
                  `${formatHijri(r.startDate)} هـ / ${formatGregorianShort(r.startDate)}`,
              },
              {
                header: "إلى",
                accessor: (r) =>
                  `${formatHijri(r.endDate)} هـ / ${formatGregorianShort(r.endDate)}`,
              },
              { header: "عدد الأيام", accessor: (r) => String(r.daysCount) },
              {
                header: "الحالة",
                accessor: (r) =>
                  (LEAVE_STATUS as Record<string, string>)[r.status] ??
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
              const res = await fetch(`/api/hr/leaves?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as EmployeeLeaveItem[];
            }}
          />
          <Link href="/dashboard/hr/leaves/new">
            <Button>
              <Plus className="size-4" />
              إضافة إجازة
            </Button>
          </Link>
        </div>
      </div>

      {/* فلاتر */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">نوع الإجازة:</span>
          <Select
            className="w-40"
            value={filters.leaveType ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                leaveType: (e.target.value ||
                  undefined) as EmployeeLeaveFiltersInput["leaveType"],
                page: 1,
              }))
            }
          >
            <option value="">الكل</option>
            {Object.entries(LEAVE_TYPE).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">الحالة:</span>
          <Select
            className="w-40"
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: (e.target.value ||
                  undefined) as EmployeeLeaveFiltersInput["status"],
                page: 1,
              }))
            }
          >
            <option value="">الكل</option>
            {Object.entries(LEAVE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
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
          icon={CalendarOff}
          title="لا توجد إجازات"
          description="ابدأ بتسجيل أول إجازة لموظف"
          action={
            <Link href="/dashboard/hr/leaves/new">
              <Button>
                <Plus className="size-4" />
                إضافة إجازة
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
                  <th className="px-4 py-3">اسم الموظف</th>
                  <th className="px-4 py-3">نوع الإجازة</th>
                  <th className="px-4 py-3">من</th>
                  <th className="px-4 py-3">إلى</th>
                  <th className="px-4 py-3">عدد الأيام</th>
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
                      {r.employeeName}
                    </td>
                    <td className="px-4 py-3">
                      <LeaveTypeBadge type={r.leaveType} />
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={r.startDate} />
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={r.endDate} />
                    </td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums">
                      {r.daysCount}
                    </td>
                    <td className="px-4 py-3">
                      <LeaveStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/hr/leaves/${r.id}/edit`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/hr/leaves/${r.id}/edit`}>
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
        title="حذف الإجازة"
        description="سيتم حذف هذه الإجازة نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
