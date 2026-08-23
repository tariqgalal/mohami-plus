"use client";

import { useState } from "react";
import { Filter, Printer, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { HijriDatePicker } from "@/components/shared/hijri-date-picker";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import { LeaveStatusBadge, LeaveTypeBadge } from "@/components/hr/leave-badges";
import { useEmployeeLeaves } from "@/hooks/use-employee-leaves";
import { useTeam } from "@/hooks/use-team";
import { LEAVE_TYPE } from "@/lib/constants";
import type { EmployeeLeaveFiltersInput } from "@/lib/validations/employee-leave";

export default function LeaveReportsPage() {
  const { data: team } = useTeam();

  // مسودة الفلاتر (قبل الضغط على تصفية)
  const [draft, setDraft] = useState<{
    employeeId: string;
    leaveType: string;
    from: string;
    to: string;
  }>({ employeeId: "", leaveType: "", from: "", to: "" });

  const [applied, setApplied] = useState<Partial<EmployeeLeaveFiltersInput>>({
    page: 1,
    limit: 1000,
    sortBy: "startDate",
    sortDir: "asc",
  });

  const { data, isLoading, isFetching } = useEmployeeLeaves(applied);

  function applyFilters() {
    setApplied({
      page: 1,
      limit: 1000,
      sortBy: "startDate",
      sortDir: "asc",
      employeeId: draft.employeeId || undefined,
      leaveType:
        (draft.leaveType || undefined) as EmployeeLeaveFiltersInput["leaveType"],
      from: (draft.from || undefined) as unknown as Date | undefined,
      to: (draft.to || undefined) as unknown as Date | undefined,
    });
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الموارد البشرية" },
          { label: "تقارير إجازات الموظفين" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileBarChart className="size-7 text-brand-600" />
            تقارير إجازات الموظفين
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            استعرض إجازات الموظفين حسب الموظف والنوع والفترة الزمنية
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          طباعة
        </Button>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>عوامل التصفية</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">الموظف</Label>
            <Select
              id="employeeId"
              value={draft.employeeId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, employeeId: e.target.value }))
              }
            >
              <option value="">كل الموظفين</option>
              {team?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveType">نوع الإجازة</Label>
            <Select
              id="leaveType"
              value={draft.leaveType}
              onChange={(e) =>
                setDraft((d) => ({ ...d, leaveType: e.target.value }))
              }
            >
              <option value="">كل الأنواع</option>
              {Object.entries(LEAVE_TYPE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>من (هجري)</Label>
            <HijriDatePicker
              value={draft.from || null}
              onChange={(v) =>
                setDraft((d) => ({ ...d, from: v.gregorian ?? "" }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>إلى (هجري)</Label>
            <HijriDatePicker
              value={draft.to || null}
              onChange={(v) => setDraft((d) => ({ ...d, to: v.gregorian ?? "" }))}
            />
          </div>

          <div className="lg:col-span-4 flex justify-end">
            <Button onClick={applyFilters} loading={isFetching}>
              <Filter className="size-4" />
              تصفية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* عنوان الطباعة */}
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold text-center">
          تقرير إجازات الموظفين
        </h2>
      </div>

      {isLoading ? (
        <Card className="p-4">
          <TableSkeleton rows={6} cols={6} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-600">
              عدد الإجازات: <strong className="tabular-nums">{items.length}</strong>
            </span>
            <span className="text-sm text-slate-600">
              إجمالي الأيام:{" "}
              <strong className="tabular-nums text-brand-700">
                {data?.totalDays ?? 0}
              </strong>{" "}
              يوم
            </span>
          </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      لا توجد إجازات مطابقة لعوامل التصفية
                    </td>
                  </tr>
                ) : (
                  items.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 tabular-nums">
                        {i + 1}
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
