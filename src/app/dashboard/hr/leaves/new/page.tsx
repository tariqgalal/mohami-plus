import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmployeeLeaveForm } from "@/components/hr/employee-leave-form";

export const metadata: Metadata = { title: "إجازة جديدة" };

export default function NewLeavePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "سجل الإجازات", href: "/dashboard/hr/leaves" },
          { label: "إجازة جديدة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تسجيل إجازة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          سجّل إجازة لأحد الموظفين. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <EmployeeLeaveForm mode="create" />
    </div>
  );
}
