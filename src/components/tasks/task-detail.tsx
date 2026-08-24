"use client";

import Link from "next/link";
import {
  Edit,
  User,
  Lock,
  CheckCircle2,
  Send,
  MessageSquareText,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskTimer } from "@/components/tasks/task-timer";
import { useTask, useUpdateTask } from "@/hooks/use-tasks";
import { TASK_PROJECT_TYPE } from "@/lib/constants";
import { formatTaskNumber } from "@/lib/format";
import { toast } from "@/store/toast-store";

export function TaskDetail({ id }: { id: string }) {
  const { data: task, isLoading, isError, error } = useTask(id);
  const updateMut = useUpdateTask(id);

  async function setStatus(
    status: "AWAITING_APPROVAL" | "COMPLETED",
    successMsg: string,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateMut.mutateAsync({ status } as any);
      toast.success(successMsg);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "تعذّر تحديث الحالة");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <Card className="p-6 text-center text-red-600 max-w-4xl mx-auto">
        {isError ? `حدث خطأ: ${(error as Error).message}` : "المهمة غير موجودة"}
      </Card>
    );
  }

  const assignees = task.assignedTo ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المهام", href: "/dashboard/tasks" },
          { label: task.title },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-slate-400 tabular-nums text-lg">
              {formatTaskNumber(task.number)}
            </span>
            {task.isConfidential && (
              <Lock className="size-5 text-amber-500" />
            )}
            {task.title}
          </h1>
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
        <div className="flex items-center gap-2">
          {task.status === "PENDING" && (
            <Button
              variant="outline"
              onClick={() =>
                setStatus("AWAITING_APPROVAL", "تم إرسال المهمة للاعتماد")
              }
              loading={updateMut.isPending}
            >
              <Send className="size-4" />
              إرسال للاعتماد
            </Button>
          )}
          {task.status === "AWAITING_APPROVAL" && (
            <Button
              onClick={() => setStatus("COMPLETED", "تم اعتماد المهمة")}
              loading={updateMut.isPending}
            >
              <CheckCircle2 className="size-4" />
              اعتماد المهمة
            </Button>
          )}
          <Link href={`/dashboard/tasks/${task.id}/edit`}>
            <Button variant="outline">
              <Edit className="size-4" />
              تعديل
            </Button>
          </Link>
        </div>
      </div>

      {/* عداد الوقت */}
      <TaskTimer
        taskId={task.id}
        timeSpent={task.timeSpent}
        timerStartedAt={task.timerStartedAt}
      />

      <Card>
        <CardHeader>
          <CardTitle>بيانات المهمة</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">نوع المشروع</p>
            <p className="text-sm text-slate-700">
              {(TASK_PROJECT_TYPE as Record<string, string>)[
                task.projectType
              ] ?? task.projectType}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">العميل</p>
            <p className="text-sm text-slate-700">{task.clientName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">تاريخ الاستحقاق</p>
            {task.dueDate ? (
              <DualDateDisplay date={task.dueDate} />
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">المكلّفون</p>
            {assignees.length ? (
              <div className="flex flex-wrap gap-2">
                {assignees.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    <User className="size-3 text-slate-400" />
                    {a.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}
          </div>

          {/* شارات الخيارات */}
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {task.isConfidential && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700 border border-amber-200">
                <Lock className="size-3" />
                مهمة سرية
              </span>
            )}
            {task.completedWithoutAssignment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                أُنجزت بدون تكليف
              </span>
            )}
          </div>

          {task.description && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 mb-1">الوصف</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {task.reply && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <MessageSquareText className="size-3.5 text-brand-500" />
                الرد / التعليق
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap rounded-lg bg-slate-50 border border-slate-200 p-3">
                {task.reply}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
