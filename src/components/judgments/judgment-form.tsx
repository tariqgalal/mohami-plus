"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HijriDatePicker } from "@/components/shared/hijri-date-picker";
import {
  JUDGMENT_LEVEL,
  JUDGMENT_RESULT,
  OBJECTION_STATUS,
} from "@/lib/constants";
import { useCases } from "@/hooks/use-cases";
import { useCreateJudgment, useUpdateJudgment } from "@/hooks/use-judgments";
import { toast } from "@/store/toast-store";

interface JudgmentInitial {
  id?: string;
  caseId?: string;
  judgmentLevel?: string;
  judgmentResult?: string;
  judgmentSummary?: string | null;
  receiveDate?: string | null;
  receiveDateHijri?: string | null;
  objectionStatus?: string;
  objectionDeadline?: string | null;
  notes?: string | null;
}

interface JudgmentFormValues {
  caseId: string;
  judgmentLevel: string;
  judgmentResult: string;
  judgmentSummary: string;
  receiveDate: string;
  receiveDateHijri: string;
  objectionStatus: string;
  objectionDeadline: string;
  notes: string;
}

interface JudgmentFormProps {
  initial?: JudgmentInitial;
  mode: "create" | "edit";
}

const RETURN_TO = "/dashboard/judgments";

export function JudgmentForm({ initial, mode }: JudgmentFormProps) {
  const router = useRouter();
  const { data: casesData } = useCases({ page: 1, limit: 1000 });
  const createMut = useCreateJudgment();
  const updateMut = useUpdateJudgment(initial?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JudgmentFormValues>({
    defaultValues: {
      caseId: initial?.caseId ?? "",
      judgmentLevel: initial?.judgmentLevel ?? "FIRST_INSTANCE",
      judgmentResult: initial?.judgmentResult ?? "PARTIAL",
      judgmentSummary: initial?.judgmentSummary ?? "",
      receiveDate: initial?.receiveDate ?? "",
      receiveDateHijri: initial?.receiveDateHijri ?? "",
      objectionStatus: initial?.objectionStatus ?? "PENDING",
      objectionDeadline: initial?.objectionDeadline ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(data: JudgmentFormValues) {
    if (!data.caseId) {
      toast.error("يرجى اختيار القضية");
      return;
    }
    try {
      const payload = {
        caseId: data.caseId,
        judgmentLevel: data.judgmentLevel as
          | "FIRST_INSTANCE"
          | "APPEAL"
          | "SUPREME",
        judgmentResult: data.judgmentResult as
          | "IN_FAVOR"
          | "AGAINST"
          | "PARTIAL",
        judgmentSummary: data.judgmentSummary || null,
        receiveDate: data.receiveDate || null,
        receiveDateHijri: data.receiveDateHijri || null,
        objectionStatus: data.objectionStatus as
          | "PRE_FILING"
          | "PENDING"
          | "NO_OBJECTION"
          | "OBJECTED",
        objectionDeadline: data.objectionDeadline || null,
        notes: data.notes || null,
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMut.mutateAsync(payload as any);
        toast.success("تم تسجيل الحكم بنجاح");
        router.push(RETURN_TO);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(RETURN_TO);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ الحكم");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الحكم</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="caseId">القضية *</Label>
            <Select id="caseId" {...register("caseId", { required: true })}>
              <option value="">— اختر القضية —</option>
              {casesData?.items?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.title}
                </option>
              ))}
            </Select>
            {errors.caseId && (
              <p className="text-xs text-red-600">القضية مطلوبة</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="judgmentLevel">درجة الترافع *</Label>
            <Select id="judgmentLevel" {...register("judgmentLevel")}>
              {Object.entries(JUDGMENT_LEVEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="judgmentResult">نتيجة الحكم *</Label>
            <Select id="judgmentResult" {...register("judgmentResult")}>
              {Object.entries(JUDGMENT_RESULT).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>تاريخ استلام الحكم</Label>
            <Controller
              control={control}
              name="receiveDate"
              render={({ field }) => (
                <HijriDatePicker
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v.gregorian ?? "");
                    setValue("receiveDateHijri", v.hijri ?? "");
                  }}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectionStatus">حالة الاعتراض</Label>
            <Select id="objectionStatus" {...register("objectionStatus")}>
              {Object.entries(OBJECTION_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>آخر موعد للاعتراض</Label>
            <Controller
              control={control}
              name="objectionDeadline"
              render={({ field }) => (
                <HijriDatePicker
                  value={field.value || null}
                  onChange={(v) => field.onChange(v.gregorian ?? "")}
                />
              )}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="judgmentSummary">ملخص نص الحكم</Label>
            <Textarea
              id="judgmentSummary"
              rows={4}
              placeholder="ملخص منطوق الحكم..."
              {...register("judgmentSummary")}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="ملاحظات إضافية..."
              {...register("notes")}
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
          {mode === "create" ? "تسجيل الحكم" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
