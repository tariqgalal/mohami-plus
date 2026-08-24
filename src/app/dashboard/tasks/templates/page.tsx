import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TaskTemplatesManager } from "@/components/tasks/task-templates-manager";

export const metadata: Metadata = { title: "الردود الجاهزة للمهام" };

export default function TaskTemplatesPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المهام", href: "/dashboard/tasks" },
          { label: "الردود الجاهزة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          إعدادات الردود الجاهزة
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          أضف وعدّل الردود الجاهزة التي تظهر عند تعبئة المهام لتسريع العمل.
        </p>
      </div>
      <TaskTemplatesManager />
    </div>
  );
}
