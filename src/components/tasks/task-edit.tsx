"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { TaskForm } from "@/components/tasks/task-form";
import { useTask } from "@/hooks/use-tasks";

export function TaskEdit({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useTask(id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المهام", href: "/dashboard/tasks" },
          { label: "تعديل المهمة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل المهمة</h1>
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
        <TaskForm
          mode="edit"
          initial={{
            id: data.id,
            number: data.number,
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status,
            projectType: data.projectType,
            caseId: data.caseId,
            clientId: data.clientId,
            assignedTo: data.assignedTo,
            dueDate: data.dueDate,
            dueDateHijri: data.dueDateHijri,
            isConfidential: data.isConfidential,
            completedWithoutAssignment: data.completedWithoutAssignment,
            reply: data.reply,
          }}
        />
      )}
    </div>
  );
}
