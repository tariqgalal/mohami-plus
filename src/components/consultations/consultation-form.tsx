"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HijriDatePicker } from "@/components/shared/hijri-date-picker";
import { CONSULTATION_TYPE, CONSULTATION_STATUS } from "@/lib/constants";
import { useTeam } from "@/hooks/use-team";
import { useClients } from "@/hooks/use-clients";
import {
  useCreateConsultation,
  useUpdateConsultation,
  type Assignee,
} from "@/hooks/use-consultations";
import { toast } from "@/store/toast-store";

interface ConsultationInitial {
  id?: string;
  title?: string;
  type?: string;
  clientId?: string | null;
  assignedTo?: Assignee[] | null;
  date?: string | null;
  dateHijri?: string | null;
  description?: string | null;
  status?: string;
}

interface ConsultationFormValues {
  title: string;
  type: string;
  clientId: string;
  date: string;
  dateHijri: string;
  description: string;
  status: string;
}

interface ConsultationFormProps {
  initial?: ConsultationInitial;
  mode: "create" | "edit";
}

const RETURN_TO = "/dashboard/consultations";

export function ConsultationForm({ initial, mode }: ConsultationFormProps) {
  const router = useRouter();
  const { data: team } = useTeam();
  const { data: clients } = useClients();
  const createMut = useCreateConsultation();
  const updateMut = useUpdateConsultation(initial?.id ?? "");

  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    initial?.assignedTo?.map((a) => a.id) ?? [],
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationFormValues>({
    defaultValues: {
      title: initial?.title ?? "",
      type: initial?.type ?? "LEGAL_CONSULTATION",
      clientId: initial?.clientId ?? "",
      date: initial?.date ?? "",
      dateHijri: initial?.dateHijri ?? "",
      description: initial?.description ?? "",
      status: initial?.status ?? "ACTIVE",
    },
  });

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onSubmit(data: ConsultationFormValues) {
    if (!data.date) {
      toast.error("يرجى تحديد تاريخ الاستشارة");
      return;
    }
    const assignedTo: Assignee[] = assigneeIds
      .map((id) => {
        const m = team?.find((t) => t.id === id);
        return m ? { id: m.id, name: m.name } : null;
      })
      .filter((x): x is Assignee => x !== null);

    try {
      const payload = {
        title: data.title,
        type: data.type as
          | "LEGAL_CONSULTATION"
          | "REGULATIONS_REVIEW"
          | "CONTRACT_REVIEW"
          | "OTHER",
        clientId: data.clientId || null,
        assignedTo,
        date: data.date,
        dateHijri: data.dateHijri || null,
        description: data.description || null,
        status: data.status as "ACTIVE" | "COMPLETED" | "CANCELLED",
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMut.mutateAsync(payload as any);
        toast.success("تم تسجيل الاستشارة بنجاح");
        router.push(RETURN_TO);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(RETURN_TO);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ الاستشارة");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الاستشارة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">اسم الاستشارة *</Label>
            <Input
              id="title"
              placeholder="مثال: استشارة بخصوص عقد شراكة"
              {...register("title", { required: true })}
            />
            {errors.title && (
              <p className="text-xs text-red-600">اسم الاستشارة مطلوب</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">النوع *</Label>
            <Select id="type" {...register("type")}>
              {Object.entries(CONSULTATION_TYPE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

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
            <Label>تاريخ الاستشارة *</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <HijriDatePicker
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v.gregorian ?? "");
                    setValue("dateHijri", v.hijri ?? "");
                  }}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select id="status" {...register("status")}>
              {Object.entries(CONSULTATION_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>المسؤولون</Label>
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
              placeholder="تفاصيل الاستشارة..."
              {...register("description")}
            />
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
          {mode === "create" ? "تسجيل الاستشارة" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
