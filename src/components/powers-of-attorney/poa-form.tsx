"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, AlertCircle, FileText, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HijriDatePicker } from "@/components/shared/hijri-date-picker";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";
import { POA_STATUS } from "@/lib/constants";
import { createPowerOfAttorneySchema } from "@/lib/validations/power-of-attorney";
import { useClients } from "@/hooks/use-clients";
import { useTeam } from "@/hooks/use-team";
import { useCases } from "@/hooks/use-cases";
import { useConsultations } from "@/hooks/use-consultations";
import {
  useCreatePowerOfAttorney,
  useUpdatePowerOfAttorney,
} from "@/hooks/use-powers-of-attorney";
import { toast } from "@/store/toast-store";
import { CheckboxGroup } from "@/components/shared/checkbox-group";

interface PoaInitial {
  id?: string;
  number?: string;
  clientId?: string;
  startDate?: string;
  startDateHijri?: string;
  endDate?: string;
  endDateHijri?: string;
  status?: string;
  notes?: string | null;
  employeeIds?: string[];
  caseIds?: string[];
  executionIds?: string[];
  consultationIds?: string[];
}

interface PoaFormValues {
  number: string;
  clientId: string;
  startDate: string;
  startDateHijri: string;
  endDate: string;
  endDateHijri: string;
  status: string;
  notes: string;
  employeeIds: string[];
  caseIds: string[];
  executionIds: string[];
  consultationIds: string[];
}

interface PoaFormProps {
  initial?: PoaInitial;
  mode: "create" | "edit";
}

export function PoaForm({ initial, mode }: PoaFormProps) {
  const router = useRouter();
  const { data: clients } = useClients();
  const { data: team } = useTeam();
  const { data: casesData } = useCases({ page: 1, limit: 1000 });
  const { data: consultationsData } = useConsultations({ page: 1, limit: 1000 });
  const createMut = useCreatePowerOfAttorney();
  const updateMut = useUpdatePowerOfAttorney(initial?.id ?? "");
  const [attachments, setAttachments] = useState<UploadedFileInfo[]>([]);
  const [pendingFile, setPendingFile] = useState<UploadedFileInfo | null>(null);

  const allCases = casesData?.items ?? [];
  const regularCases = allCases.filter((c) => c.caseType !== "EXECUTION");
  const executionCases = allCases.filter((c) => c.caseType === "EXECUTION");
  const consultations = consultationsData?.items ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PoaFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPowerOfAttorneySchema) as any,
    defaultValues: {
      number: initial?.number ?? "",
      clientId: initial?.clientId ?? "",
      startDate: initial?.startDate ?? "",
      startDateHijri: initial?.startDateHijri ?? "",
      endDate: initial?.endDate ?? "",
      endDateHijri: initial?.endDateHijri ?? "",
      status: initial?.status ?? "ACTIVE",
      notes: initial?.notes ?? "",
      employeeIds: initial?.employeeIds ?? [],
      caseIds: initial?.caseIds ?? [],
      executionIds: initial?.executionIds ?? [],
      consultationIds: initial?.consultationIds ?? [],
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  async function onSubmit(data: PoaFormValues) {
    try {
      const payload = {
        ...data,
        notes: data.notes || null,
        attachments: attachments.map((a) => ({
          url: a.url,
          name: a.name,
          size: a.size,
          type: a.type,
        })),
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const created = await createMut.mutateAsync(payload as any);
        toast.success("تم إضافة الوكالة بنجاح");
        router.push(`/dashboard/powers-of-attorney/${created.id}`);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(`/dashboard/powers-of-attorney/${initial.id}`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ الوكالة");
    }
  }

  function addPendingFile() {
    if (pendingFile) {
      setAttachments((prev) => [...prev, pendingFile]);
      setPendingFile(null);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الوكالة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="number">رقم الوكالة *</Label>
            <Input
              id="number"
              placeholder="مثال: 472771403"
              {...register("number")}
            />
            {errors.number && (
              <p className="text-xs text-red-600">{errors.number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">العميل *</Label>
            <Select id="clientId" {...register("clientId")}>
              <option value="">— اختر العميل —</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.phone}
                </option>
              ))}
            </Select>
            {errors.clientId && (
              <p className="text-xs text-red-600">{errors.clientId.message}</p>
            )}
            <p className="text-xs text-slate-500">
              لا يوجد عميل؟{" "}
              <a
                href="/dashboard/clients/new"
                className="text-brand-600 hover:underline"
              >
                أضف عميل جديد
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label>تاريخ البداية *</Label>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <HijriDatePicker
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v.gregorian ?? "");
                    setValue("startDateHijri", v.hijri ?? "");
                  }}
                />
              )}
            />
            {errors.startDate && (
              <p className="text-xs text-red-600">
                {errors.startDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>تاريخ الانتهاء *</Label>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <HijriDatePicker
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v.gregorian ?? "");
                    setValue("endDateHijri", v.hijri ?? "");
                  }}
                />
              )}
            />
            {errors.endDate && (
              <p className="text-xs text-red-600">{errors.endDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select id="status" {...register("status")}>
              {Object.entries(POA_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="أي ملاحظات على الوكالة..."
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الجهات المرتبطة بالوكالة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              الموظفون المخوّلون <span className="text-red-600">*</span>
            </Label>
            <Controller
              control={control}
              name="employeeIds"
              render={({ field }) => (
                <CheckboxGroup
                  options={(team ?? []).map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  emptyText="لا يوجد أعضاء فريق"
                />
              )}
            />
            {errors.employeeIds && (
              <p className="text-xs text-red-600">
                {errors.employeeIds.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>القضايا المرتبطة (اختياري)</Label>
            <Controller
              control={control}
              name="caseIds"
              render={({ field }) => (
                <CheckboxGroup
                  options={regularCases.map((c) => ({
                    value: c.id,
                    label: `${c.caseNumber} — ${c.title}`,
                  }))}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  emptyText="لا توجد قضايا"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>طلبات التنفيذ المرتبطة (اختياري)</Label>
            <Controller
              control={control}
              name="executionIds"
              render={({ field }) => (
                <CheckboxGroup
                  options={executionCases.map((c) => ({
                    value: c.id,
                    label: `${c.caseNumber} — ${c.title}`,
                  }))}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  emptyText="لا توجد طلبات تنفيذ"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>الاستشارات المرتبطة (اختياري)</Label>
            <Controller
              control={control}
              name="consultationIds"
              render={({ field }) => (
                <CheckboxGroup
                  options={consultations.map((c) => ({
                    value: c.id,
                    label: `#${c.number} — ${c.title}`,
                  }))}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  emptyText="لا توجد استشارات"
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المرفقات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            أضف صورة الوكالة أو أي مستندات مرتبطة بها.
          </p>
          {attachments.length > 0 && (
            <ul className="space-y-2">
              {attachments.map((a, i) => (
                <li
                  key={`${a.url}-${i}`}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2"
                >
                  <FileText className="size-4 text-slate-500 shrink-0" />
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate text-sm text-slate-700 hover:underline"
                  >
                    {a.name}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    aria-label="إزالة المرفق"
                  >
                    <XIcon className="size-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <FileUpload
            value={pendingFile}
            onChange={setPendingFile}
            label="اختر ملفاً لرفعه"
          />
          {pendingFile && (
            <Button type="button" variant="outline" onClick={addPendingFile}>
              <Plus className="size-4" />
              إضافة إلى المرفقات
            </Button>
          )}
        </CardContent>
      </Card>

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>راجع الحقول المظللة بالأحمر</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-white/80 backdrop-blur p-4 -mx-6 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!startDate || !endDate}
        >
          {mode === "create" ? "إضافة الوكالة" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
