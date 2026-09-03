"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { AlertCircle, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HijriDatePicker } from "@/components/shared/hijri-date-picker";
import { TaskReplyDialog } from "@/components/tasks/task-reply-dialog";
import {
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_PROJECT_TYPE,
} from "@/lib/constants";
import { useTeam } from "@/hooks/use-team";
import { useClients } from "@/hooks/use-clients";
import { useCases } from "@/hooks/use-cases";
import {
  useCreateTask,
  useUpdateTask,
  type Assignee,
} from "@/hooks/use-tasks";
import { toast } from "@/store/toast-store";

interface TaskInitial {
  id?: string;
  number?: number;
  title?: string;
  description?: string | null;
  priority?: string;
  status?: string;
  projectType?: string;
  caseId?: string | null;
  clientId?: string | null;
  assignedTo?: Assignee[] | null;
  dueDate?: string | null;
  dueDateHijri?: string | null;
  isConfidential?: boolean;
  completedWithoutAssignment?: boolean;
  reply?: string | null;
}

interface TaskFormValues {
  title: string;
  description: string;
  priority: string;
  status: string;
  projectType: string;
  caseId: string;
  clientId: string;
  dueDate: string;
  dueDateHijri: string;
  reply: string;
}

interface TaskFormProps {
  initial?: TaskInitial;
  mode: "create" | "edit";
}

const RETURN_TO = "/dashboard/tasks";

// أنواع المشاريع التي تتطلب اختيار قضية
const CASE_LINKED = new Set(["CASE", "EXECUTION"]);

export function TaskForm({ initial, mode }: TaskFormProps) {
  const router = useRouter();
  const { data: team } = useTeam();
  const { data: clients } = useClients();
  const { data: casesData } = useCases({ page: 1, limit: 1000 });
  const createMut = useCreateTask();
  const updateMut = useUpdateTask(initial?.id ?? "");

  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    initial?.assignedTo?.map((a) => a.id) ?? [],
  );
  const [isConfidential, setIsConfidential] = useState(
    initial?.isConfidential ?? false,
  );
  const [completedWithoutAssignment, setCompletedWithoutAssignment] = useState(
    initial?.completedWithoutAssignment ?? false,
  );
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      priority: initial?.priority ?? "NORMAL",
      status: initial?.status ?? "PENDING",
      projectType: initial?.projectType ?? "NONE",
      caseId: initial?.caseId ?? "",
      clientId: initial?.clientId ?? "",
      dueDate: initial?.dueDate ?? "",
      dueDateHijri: initial?.dueDateHijri ?? "",
      reply: initial?.reply ?? "",
    },
  });

  const projectType = watch("projectType");
  const showCaseSelect = CASE_LINKED.has(projectType);

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onSubmit(data: TaskFormValues) {
    const assignedTo: Assignee[] = assigneeIds
      .map((id) => {
        const m = team?.find((t) => t.id === id);
        return m ? { id: m.id, name: m.name } : null;
      })
      .filter((x): x is Assignee => x !== null);

    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        priority: data.priority as
          | "URGENT"
          | "NORMAL"
          | "IMPORTANT"
          | "URGENT_IMPORTANT",
        status: data.status as
          | "PENDING"
          | "AWAITING_APPROVAL"
          | "COMPLETED"
          | "CANCELLED",
        projectType: data.projectType as
          | "NONE"
          | "CASE"
          | "EXECUTION"
          | "CONSULTATION"
          | "OTHER_PROJECT",
        caseId: showCaseSelect ? data.caseId || null : null,
        clientId: data.clientId || null,
        assignedTo,
        dueDate: data.dueDate || null,
        dueDateHijri: data.dueDateHijri || null,
        isConfidential,
        completedWithoutAssignment,
        reply: data.reply || null,
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMut.mutateAsync(payload as any);
        toast.success("تم إنشاء المهمة بنجاح");
        router.push(RETURN_TO);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(RETURN_TO);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ المهمة");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات المهمة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">عنوان المهمة *</Label>
            <Input
              id="title"
              placeholder="مثال: إعداد مذكرة الدفاع"
              {...register("title", { required: true })}
            />
            {errors.title && (
              <p className="text-xs text-red-600">عنوان المهمة مطلوب</p>
            )}
          </div>

          {/* رقم المهمة التلقائي */}
          <div className="space-y-2">
            <Label>رقم المهمة</Label>
            <Input
              readOnly
              disabled
              value={
                mode === "edit" && initial?.number
                  ? `MAIN-${String(initial.number).padStart(4, "0")}`
                  : "يُنشأ تلقائياً (MAIN-####)"
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select id="status" {...register("status")}>
              {Object.entries(TASK_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          {/* الأولوية */}
          <div className="space-y-2 md:col-span-2">
            <Label>الأولوية</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TASK_PRIORITY).map(([k, v]) => (
                <label
                  key={k}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700 transition-colors"
                >
                  <input
                    type="radio"
                    value={k}
                    className="accent-brand-600"
                    {...register("priority")}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* نوع المشروع */}
          <div className="space-y-2 md:col-span-2">
            <Label>نوع المشروع المرتبط</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TASK_PROJECT_TYPE).map(([k, v]) => (
                <label
                  key={k}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700 transition-colors"
                >
                  <input
                    type="radio"
                    value={k}
                    className="accent-brand-600"
                    {...register("projectType")}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {showCaseSelect && (
            <div className="space-y-2">
              <Label htmlFor="caseId">القضية المرتبطة</Label>
              <Select id="caseId" {...register("caseId")}>
                <option value="">— اختر قضية —</option>
                {casesData?.items?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="clientId">العميل</Label>
            <Select id="clientId" {...register("clientId")}>
              <option value="">— بدون عميل —</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>تاريخ الاستحقاق</Label>
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <HijriDatePicker
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v.gregorian ?? "");
                    setValue("dueDateHijri", v.hijri ?? "");
                  }}
                />
              )}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>المكلّفون</Label>
            <div className="flex flex-wrap gap-2">
              {team?.length ? (
                team.map((m) => {
                  const checked = assigneeIds.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleAssignee(m.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        checked
                          ? "bg-brand-600 border-brand-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-brand-400"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">لا يوجد أعضاء فريق</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="تفاصيل المهمة..."
              {...register("description")}
            />
          </div>

          {/* الرد + اختيار رد جاهز */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reply">الرد / التعليق</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplyDialogOpen(true)}
              >
                <MessageSquareText className="size-4" />
                اختيار رد جاهز
              </Button>
            </div>
            <Textarea
              id="reply"
              rows={3}
              placeholder="اكتب رداً أو اختر من الردود الجاهزة..."
              {...register("reply")}
            />
          </div>

          {/* خيارات إضافية */}
          <div className="md:col-span-2 space-y-3 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-700">خيارات إضافية</p>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <Checkbox
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
              />
              مهمة سرية
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <Checkbox
                checked={completedWithoutAssignment}
                onChange={(e) =>
                  setCompletedWithoutAssignment(e.target.checked)
                }
              />
              مهمة تم إنجازها بدون تكليف
            </label>
          </div>
        </CardContent>
      </Card>

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>راجع الحقول المطلوبة</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-white/80 backdrop-blur p-4 -mx-6 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {mode === "create" ? "إنشاء المهمة" : "حفظ التعديلات"}
        </Button>
      </div>

      <TaskReplyDialog
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        onSelect={(text) => {
          const current = watch("reply");
          setValue("reply", current ? `${current}\n${text}` : text);
        }}
      />
    </form>
  );
}
