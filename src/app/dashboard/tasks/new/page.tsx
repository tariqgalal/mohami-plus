import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TaskForm } from "@/components/tasks/task-form";

export const metadata: Metadata = { title: "مهمة جديدة" };

export default function NewTaskPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المهام", href: "/dashboard/tasks" },
          { label: "مهمة جديدة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">مهمة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          أنشئ مهمة جديدة. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <TaskForm mode="create" />
    </div>
  );
}
