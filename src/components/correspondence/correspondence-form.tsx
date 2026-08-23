"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Plus, AlertCircle, FileText, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";
import {
  CORRESPONDENCE_CATEGORY,
  CORRESPONDENCE_TYPE,
  CORRESPONDENCE_DIRECTION,
} from "@/lib/constants";
import { useTeam } from "@/hooks/use-team";
import { useClients } from "@/hooks/use-clients";
import { useCreateCorrespondence } from "@/hooks/use-correspondence";
import { toast } from "@/store/toast-store";

interface CorrespondenceFormValues {
  type: "CLIENT" | "EMPLOYEE";
  category: string;
  direction: "INCOMING" | "OUTGOING";
  subject: string;
  body: string;
}

interface CorrespondenceFormProps {
  /** النوع الافتراضي (من صفحة القائمة) */
  defaultType?: "CLIENT" | "EMPLOYEE";
  /** في حالة الرد على مراسلة قائمة */
  reply?: {
    parentId: string;
    type: "CLIENT" | "EMPLOYEE";
    category: string;
    subject: string;
  };
}

export function CorrespondenceForm({
  defaultType = "CLIENT",
  reply,
}: CorrespondenceFormProps) {
  const router = useRouter();
  const { data: team } = useTeam();
  const { data: clients } = useClients();
  const createMut = useCreateCorrespondence();

  const [recipients, setRecipients] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<UploadedFileInfo[]>([]);
  const [pendingFile, setPendingFile] = useState<UploadedFileInfo | null>(null);
  const [recipientError, setRecipientError] = useState(false);

  const isReply = !!reply;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CorrespondenceFormValues>({
    defaultValues: {
      type: reply?.type ?? defaultType,
      category: reply?.category ?? "DISCUSSIONS",
      direction: "OUTGOING",
      subject: reply ? `رد: ${reply.subject}` : "",
      body: "",
    },
  });

  const type = watch("type");
  const options =
    type === "EMPLOYEE"
      ? (team ?? []).map((m) => ({ id: m.id, name: m.name }))
      : (clients ?? []).map((c) => ({ id: c.id, name: c.name }));

  function toggleRecipient(id: string) {
    setRecipientError(false);
    setRecipients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addPendingFile() {
    if (!pendingFile) return;
    setAttachments((prev) => [...prev, pendingFile]);
    setPendingFile(null);
  }

  async function onSubmit(data: CorrespondenceFormValues) {
    if (recipients.length === 0) {
      setRecipientError(true);
      return;
    }
    try {
      await createMut.mutateAsync({
        subject: data.subject,
        body: data.body,
        category: data.category as never,
        type: data.type as never,
        direction: data.direction as never,
        recipientIds: recipients,
        attachments: attachments.map((a) => ({
          url: a.url,
          name: a.name,
          size: a.size,
          type: a.type,
          mime: a.mime,
        })),
        parentId: reply?.parentId ?? null,
      });
      toast.success(isReply ? "تم إرسال الرد" : "تم إنشاء المراسلة");
      if (isReply) {
        router.push(`/dashboard/correspondence/${reply!.parentId}`);
      } else {
        router.push(
          data.type === "EMPLOYEE"
            ? "/dashboard/correspondence/employees"
            : "/dashboard/correspondence/clients",
        );
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ المراسلة");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isReply ? "إضافة رد" : "بيانات المراسلة"}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {!isReply && (
            <>
              <div className="space-y-2">
                <Label htmlFor="type">نوع المراسلة *</Label>
                <Select id="type" {...register("type")}>
                  {Object.entries(CORRESPONDENCE_TYPE).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction">الاتجاه *</Label>
                <Select id="direction" {...register("direction")}>
                  {Object.entries(CORRESPONDENCE_DIRECTION).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">القسم *</Label>
            <Select id="category" {...register("category")} disabled={isReply}>
              {Object.entries(CORRESPONDENCE_CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="subject">الموضوع *</Label>
            <Input
              id="subject"
              placeholder="موضوع المراسلة"
              {...register("subject", { required: "الموضوع مطلوب" })}
            />
            {errors.subject && (
              <p className="text-xs text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* إلى (multi-select) */}
          <div className="space-y-2 md:col-span-2">
            <Label>
              إلى * ({type === "EMPLOYEE" ? "الموظفون" : "العملاء"})
            </Label>
            <div className="max-h-52 overflow-y-auto rounded-md border border-slate-300 divide-y divide-slate-100">
              {options.length === 0 && (
                <p className="px-3 py-4 text-sm text-slate-400 text-center">
                  لا توجد خيارات متاحة
                </p>
              )}
              {options.map((o) => (
                <label
                  key={o.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                >
                  <Checkbox
                    checked={recipients.includes(o.id)}
                    onChange={() => toggleRecipient(o.id)}
                  />
                  <span className="text-sm text-slate-700">{o.name}</span>
                </label>
              ))}
            </div>
            {recipients.length > 0 && (
              <p className="text-xs text-slate-500">
                تم اختيار {recipients.length} مستلم
              </p>
            )}
            {recipientError && (
              <p className="text-xs text-red-600">
                اختر مستلماً واحداً على الأقل
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="body">المحتوى *</Label>
            <Textarea
              id="body"
              rows={6}
              placeholder="اكتب نص المراسلة..."
              {...register("body", { required: "المحتوى مطلوب" })}
            />
            {errors.body && (
              <p className="text-xs text-red-600">{errors.body.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المرفقات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        <Button type="submit" loading={isSubmitting}>
          {isReply ? "إرسال الرد" : "إنشاء المراسلة"}
        </Button>
      </div>
    </form>
  );
}
