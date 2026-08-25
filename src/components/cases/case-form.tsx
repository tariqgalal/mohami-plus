"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  X as XIcon,
  Users,
  Scale,
  UsersRound,
  Paperclip,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CASE_TYPES,
  CASE_STATUS,
  COURTS,
  PRIORITY_LABELS,
  SAUDI_CITIES,
} from "@/lib/constants";
import { createCaseSchema, type CreateCaseInput } from "@/lib/validations/case";
import { useClients } from "@/hooks/use-clients";
import { useTeam } from "@/hooks/use-team";
import { useCreateCase, useUpdateCase } from "@/hooks/use-cases";
import { toast } from "@/store/toast-store";
import { FileUpload, type UploadedFileInfo } from "@/components/shared/file-upload";

interface CaseFormProps {
  initial?: Partial<CreateCaseInput> & { id?: string };
  mode: "create" | "edit";
}

type StepFields = Path<CreateCaseInput>[];

const STEPS: { title: string; icon: typeof Users; fields: StepFields }[] = [
  { title: "بيانات الأطراف", icon: Users, fields: ["clientId", "opponents"] },
  {
    title: "بيانات القضية",
    icon: Scale,
    fields: [
      "title",
      "caseType",
      "classification",
      "lawsuitType",
      "court",
      "courtCity",
      "branch",
      "establishmentTxnNumber",
      "value",
      "filingDate",
      "priority",
      "status",
      "description",
    ],
  },
  {
    title: "فريق العمل",
    icon: UsersRound,
    fields: ["primaryLawyerId", "assistantLawyerIds", "notes"],
  },
  { title: "المرفقات", icon: Paperclip, fields: [] },
];

export function CaseForm({ initial, mode }: CaseFormProps) {
  const router = useRouter();
  const { data: clients } = useClients();
  const { data: team } = useTeam();
  const createMut = useCreateCase();
  const updateMut = useUpdateCase(initial?.id ?? "");
  const [attachments, setAttachments] = useState<UploadedFileInfo[]>([]);
  const [pendingFile, setPendingFile] = useState<UploadedFileInfo | null>(null);
  const [step, setStep] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateCaseInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCaseSchema) as any,
    mode: "onTouched",
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      caseType: initial?.caseType ?? "COMMERCIAL",
      classification: initial?.classification ?? "",
      lawsuitType: initial?.lawsuitType ?? "",
      branch: initial?.branch ?? "",
      establishmentTxnNumber: initial?.establishmentTxnNumber ?? "",
      court: initial?.court ?? COURTS[0],
      courtCity: initial?.courtCity ?? "",
      status: initial?.status ?? "OPEN",
      priority: initial?.priority ?? "MEDIUM",
      value: initial?.value ?? undefined,
      filingDate: initial?.filingDate ?? undefined,
      notes: initial?.notes ?? "",
      clientId: initial?.clientId ?? "",
      primaryLawyerId: initial?.primaryLawyerId ?? "",
      assistantLawyerIds: initial?.assistantLawyerIds ?? [],
      opponents: initial?.opponents ?? [],
    },
  });

  const opponentArray = useFieldArray({ control, name: "opponents" });
  const assistantIds = watch("assistantLawyerIds") ?? [];
  const primaryId = watch("primaryLawyerId");

  useEffect(() => {
    if (primaryId && assistantIds.includes(primaryId)) {
      setValue(
        "assistantLawyerIds",
        assistantIds.filter((id) => id !== primaryId),
      );
    }
  }, [primaryId, assistantIds, setValue]);

  const isLast = step === STEPS.length - 1;

  async function goNext() {
    const valid = await trigger(STEPS[step].fields);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goTo(target: number) {
    // السماح بالرجوع للخطوات السابقة بحرية
    if (target < step) setStep(target);
  }

  async function onSubmit(data: CreateCaseInput) {
    try {
      const payload = {
        ...data,
        attachments: attachments.map((a) => ({
          url: a.url,
          name: a.name,
          size: a.size,
          type: a.type,
        })),
      };
      if (mode === "create") {
        const created = await createMut.mutateAsync(payload);
        toast.success("تم إنشاء القضية بنجاح");
        router.push(`/dashboard/cases/${created.id}`);
      } else if (initial?.id) {
        await updateMut.mutateAsync(payload);
        toast.success("تم حفظ التعديلات");
        router.push(`/dashboard/cases/${initial.id}`);
      }
    } catch (e: any) {
      toast.error(e.message || "فشل حفظ القضية");
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
      {/* Stepper */}
      <ol className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.title} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-brand-600 text-white"
                    : done
                      ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                      : "bg-slate-100 text-slate-400",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                    active
                      ? "bg-white/20"
                      : done
                        ? "bg-brand-600 text-white"
                        : "bg-slate-200 text-slate-500",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <Icon className="size-4" />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronLeft className="size-4 text-slate-300" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Step 1 — بيانات الأطراف */}
      <div className={step === 0 ? "space-y-6" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>العميل</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>الخصوم</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  opponentArray.append({
                    name: "",
                    type: "",
                    lawyer: "",
                    phone: "",
                    notes: "",
                  })
                }
              >
                <Plus className="size-4" />
                إضافة خصم
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {opponentArray.fields.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                لم تضف أي خصوم بعد
              </p>
            )}
            {opponentArray.fields.map((field, i) => (
              <div
                key={field.id}
                className="grid md:grid-cols-2 gap-3 p-4 border border-slate-200 rounded-md relative"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => opponentArray.remove(i)}
                  className="absolute top-2 left-2 text-red-500"
                  aria-label="حذف الخصم"
                >
                  <Trash2 className="size-4" />
                </Button>
                <div className="space-y-2">
                  <Label>اسم الخصم *</Label>
                  <Input {...register(`opponents.${i}.name`)} />
                  {errors.opponents?.[i]?.name && (
                    <p className="text-xs text-red-600">
                      {errors.opponents[i]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select {...register(`opponents.${i}.type`)}>
                    <option value="">— اختر —</option>
                    <option value="فرد">فرد</option>
                    <option value="شركة">شركة</option>
                    <option value="جهة حكومية">جهة حكومية</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>محامي الخصم</Label>
                  <Input {...register(`opponents.${i}.lawyer`)} />
                </div>
                <div className="space-y-2">
                  <Label>رقم التواصل</Label>
                  <Input {...register(`opponents.${i}.phone`)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea rows={2} {...register(`opponents.${i}.notes`)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Step 2 — بيانات القضية */}
      <div className={step === 1 ? "space-y-6" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">عنوان القضية *</Label>
              <Input
                id="title"
                placeholder="مثال: نزاع تجاري - عقد توريد"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseType">نوع القضية *</Label>
              <Select id="caseType" {...register("caseType")}>
                {Object.entries(CASE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classification">تصنيف القضية الرئيسي</Label>
              <Input
                id="classification"
                placeholder="مثال: مطالبة مالية"
                {...register("classification")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lawsuitType">نوع الدعوى</Label>
              <Input
                id="lawsuitType"
                placeholder="مثال: دعوى مطالبة بمبلغ"
                {...register("lawsuitType")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <Select id="priority" {...register("priority")}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="court">المحكمة *</Label>
              <Select id="court" {...register("court")}>
                {COURTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courtCity">مدينة المحكمة</Label>
              <Select id="courtCity" {...register("courtCity")}>
                <option value="">— اختر —</option>
                {SAUDI_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">الفرع</Label>
              <Input
                id="branch"
                placeholder="مثال: فرع الرياض"
                {...register("branch")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="establishmentTxnNumber">
                رقم المعاملة في المنشأة
              </Label>
              <Input
                id="establishmentTxnNumber"
                placeholder="رقم مرجعي داخلي"
                {...register("establishmentTxnNumber")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">قيمة القضية (ر.س)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("value")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filingDate">تاريخ رفع الدعوى</Label>
              <Input id="filingDate" type="date" {...register("filingDate")} />
            </div>

            {mode === "edit" && (
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select id="status" {...register("status")}>
                  {Object.entries(CASE_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">وصف القضية</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="اكتب وصفاً تفصيلياً للقضية..."
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 3 — فريق العمل */}
      <div className={step === 2 ? "space-y-6" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>فريق العمل</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryLawyerId">المحامي المسؤول *</Label>
              <Select id="primaryLawyerId" {...register("primaryLawyerId")}>
                <option value="">— اختر —</option>
                {team?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.specialization ? `— ${t.specialization}` : ""}
                  </option>
                ))}
              </Select>
              {errors.primaryLawyerId && (
                <p className="text-xs text-red-600">
                  {errors.primaryLawyerId.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>محامون مساعدون</Label>
              <Controller
                control={control}
                name="assistantLawyerIds"
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-slate-200 rounded-md bg-slate-50 max-h-48 overflow-y-auto">
                    {team
                      ?.filter((t) => t.id !== primaryId)
                      .map((t) => {
                        const checked = (field.value ?? []).includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const v = field.value ?? [];
                                field.onChange(
                                  e.target.checked
                                    ? [...v, t.id]
                                    : v.filter((id) => id !== t.id),
                                );
                              }}
                              className="size-4 accent-brand-600"
                            />
                            <span>{t.name}</span>
                          </label>
                        );
                      })}
                    {!team?.length && (
                      <p className="text-xs text-slate-400 col-span-2 text-center py-2">
                        لا يوجد أعضاء فريق
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملاحظات داخلية</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="ملاحظات خاصة بفريق العمل..."
              {...register("notes")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Step 4 — المرفقات */}
      <div className={step === 3 ? "space-y-6" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>المرفقات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              أضف ملفات (توكيلات، عقود، صور، PDFs) ستُحفظ تلقائياً ضمن مستندات
              القضية بعد الحفظ.
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
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>راجع الحقول المظللة بالأحمر</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 sticky bottom-0 bg-white/80 backdrop-blur p-4 -mx-6 border-t border-slate-200">
        <div>
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ChevronRight className="size-4" />
              السابق
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            إلغاء
          </Button>
          {!isLast ? (
            <Button type="button" onClick={goNext}>
              التالي
              <ChevronLeft className="size-4" />
            </Button>
          ) : (
            <Button type="submit" loading={isSubmitting}>
              {mode === "create" ? "إنشاء القضية" : "حفظ التعديلات"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
