"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { EmployeeLeaveForm } from "@/components/hr/employee-leave-form";
import { useEmployeeLeave } from "@/hooks/use-employee-leaves";

export function LeaveEdit({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useEmployeeLeave(id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "سجل الإجازات", href: "/dashboard/hr/leaves" },
          { label: "تعديل الإجازة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الإجازة</h1>
      </div>

      {isLoading && (
        <Card className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {data && (
        <EmployeeLeaveForm
          mode="edit"
          initial={{
            id: data.id,
            employeeId: data.employeeId,
            leaveType: data.leaveType,
            startDate: data.startDate,
            startDateHijri: data.startDateHijri,
            endDate: data.endDate,
            endDateHijri: data.endDateHijri,
            status: data.status,
            notes: data.notes,
          }}
        />
      )}
    </div>
  );
}
