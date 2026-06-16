"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FileText, X as XIcon, Plus } from "lucide-react";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SESSION_TYPES,
  SESSION_STATUS,
  COURTS,
} from "@/lib/constants";
import {
  createSessionSchema,
  type CreateSessionInput,
} from "@/lib/validations/session";
import {
  useCreateSession,
  useUpdateSession,
} from "@/hooks/use-sessions";
import { useTeam } from "@/hooks/use-team";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/store/toast-store";

interface SessionFormProps {
  initial?: Partial<CreateSessionInput> & { id?: string };
  mode: "create" | "edit";
  presetCaseId?: string;
}

interface CaseOption {
  id: string;
  caseNumber: string;
  title: string;
}

function useCaseOptions() {
  return useQuery({
    queryKey: ["cases-options"],
    queryFn: async () => {
      const res = await fetch(`/api/cases?limit=100`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data.items as CaseOption[];
    },
  });
}

export function SessionForm({ initial, mode, presetCaseId }: SessionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCaseId = searchParams.get("caseId");

  const { data: cases } = useCaseOptions();
  const { data: team } = useTeam();
  const createMut = useCreateSession();
  const updateMut = useUpdateSession(initial?.id ?? "");
  const [attachments, setAttachments] = useState<UploadedFileInfo[]>([]);
  const [pendingFile, setPendingFile] = useState<UploadedFileInfo | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSessionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSessionSchema) as any,
    defaultValues: {
      caseId: initial?.caseId ?? presetCaseId ?? urlCaseId ?? "",
      lawyerId: initial?.lawyerId ?? "",
      date: initial?.date,
      time: initial?.time ?? "09:00",
      court: initial?.court ?? COURTS[0],
      hall: initial?.hall ?? "",
      judge: initial?.judge ?? "",
      sessionType: initial?.sessionType ?? "HEARING",
      status: initial?.status ?? "SCHEDULED",
      notes: initial?.notes ?? "",
      reminder: initial?.reminder ?? true,
    },
  });

  async function onSubmit(data: CreateSessionInput) {
    const payload = {
      ...data,
      attachments: attachments.map((a) => ({
        url: a.url,
        name: a.name,
        size: a.size,
        type: a.type,
      })),
    };
    try {
      if (mode === "create") {
        const created = await createMut.mutateAsync(payload);
        toast.success("تم جدولة الجلسة");
        router.push(`/dashboard/sessions/${created.id}`);
      } else if (initial?.id) {
        await updateMut.mutateAsync(payload);
        toast.success("تم حفظ التعديلات");
        router.push(`/dashboard/sessions/${initial.id}`);
      }
    } catch (e: any) {
      toast.error(e.message || "فشل حفظ الجلسة");
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
          <CardTitle>بيانات الجلسة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="caseId">القضية *</Label>
            <Select id="caseId" {...register("caseId")} disabled={!!presetCaseId}>
              <option value="">— اختر القضية —</option>
              {cases?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.title}
                </option>
              ))}
            </Select>
            {errors.caseId && (
              <p className="text-xs text-red-600">{errors.caseId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">التاريخ *</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-xs text-red-600">
                {errors.date.message?.toString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">الوقت *</Label>
            <Input id="time" type="time" {...register("time")} />
            {errors.time && (
              <p className="text-xs text-red-600">{errors.time.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="court">المحكمة *</Label>
            <Select id="court" {...register("court")}>
              {COURTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionType">نوع الجلسة</Label>
            <Select id="sessionType" {...register("sessionType")}>
              {Object.entries(SESSION_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hall">القاعة / الدائرة</Label>
            <Input id="hall" {...register("hall")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="judge">القاضي</Label>
            <Input id="judge" {...register("judge")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lawyerId">المحامي الحاضر *</Label>
            <Select id="lawyerId" {...register("lawyerId")}>
              <option value="">— اختر —</option>
              {team?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
            {errors.lawyerId && (
              <p className="text-xs text-red-600">{errors.lawyerId.message}</p>
            )}
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select id="status" {...register("status")}>
                {Object.entries(SESSION_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox {...register("reminder")} />
              <span className="text-slate-700">
                تذكير قبل الجلسة بيوم وساعة
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مرفقات الجلسة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            أرفق محضر الجلسة أو أي مستندات متعلقة. ستُحفظ مع مستندات القضية.
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
                      setAttachments((prev) => prev.filter((_, idx) => idx !== i))
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
            label="اختر ملفاً (محضر الجلسة)"
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
        <Button type="submit" loading={isSubmitting}>
          {mode === "create" ? "جدولة الجلسة" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
