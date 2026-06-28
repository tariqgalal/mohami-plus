"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MEETING_TYPES, MEETING_STATUS } from "@/lib/constants";
import {
  createMeetingSchema,
  type CreateMeetingInput,
} from "@/lib/validations/meeting";
import { useCreateMeeting, useUpdateMeeting } from "@/hooks/use-meetings";
import { useTeam } from "@/hooks/use-team";
import { toast } from "@/store/toast-store";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";

interface MeetingFormProps {
  initial?: Partial<CreateMeetingInput> & { id?: string };
  mode: "create" | "edit";
}

interface AttendeeRow {
  userId?: string;
  externalName?: string;
  externalEmail: string | null | undefined;
}

export function MeetingForm({ initial, mode }: MeetingFormProps) {
  const router = useRouter();
  const { data: team } = useTeam();
  const createMut = useCreateMeeting();
  const updateMut = useUpdateMeeting(initial?.id ?? "");

  const [attendees, setAttendees] = useState<AttendeeRow[]>(
    initial?.attendees?.map((a) => ({
      userId: a.userId ?? undefined,
      externalName: a.externalName ?? undefined,
      externalEmail: a.externalEmail ?? undefined,
    })) ?? [{ userId: undefined, externalEmail: undefined }],
  );
  const [minutesFile, setMinutesFile] = useState<UploadedFileInfo | null>(
    initial?.minutesUrl
      ? {
          url: initial.minutesUrl,
          name: initial.minutesName ?? "محضر",
          size: 0,
          type: (initial.minutesName ?? "").split(".").pop() ?? "file",
          mime: null,
        }
      : null,
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMeetingInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createMeetingSchema) as any,
    defaultValues: {
      title: initial?.title ?? "",
      date: initial?.date,
      time: initial?.time ?? "10:00",
      duration: initial?.duration ?? 60,
      meetingType: initial?.meetingType ?? "CLIENT",
      location: initial?.location ?? "",
      isVirtual: initial?.isVirtual ?? false,
      meetingLink: initial?.meetingLink ?? "",
      notes: initial?.notes ?? "",
      status: initial?.status ?? "SCHEDULED",
    },
  });

  const isVirtual = watch("isVirtual");

  function addAttendee() {
    setAttendees([...attendees, { userId: undefined, externalEmail: undefined }]);
  }

  function removeAttendee(idx: number) {
    setAttendees(attendees.filter((_, i) => i !== idx));
  }

  function updateAttendee(idx: number, patch: Partial<AttendeeRow>) {
    setAttendees(
      attendees.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    );
  }

  async function onSubmit(data: CreateMeetingInput) {
    const cleanedAttendees = attendees.filter(
      (a) => a.userId || a.externalName,
    );
    const payload = {
      ...data,
      attendees: cleanedAttendees,
      minutesUrl: minutesFile?.url ?? null,
      minutesName: minutesFile?.name ?? null,
    };

    try {
      if (mode === "create") {
        const created = await createMut.mutateAsync(payload);
        toast.success("تم جدولة الاجتماع");
        router.push(`/dashboard/meetings/${created.id}`);
      } else if (initial?.id) {
        await updateMut.mutateAsync(payload);
        toast.success("تم حفظ التعديلات");
        router.push(`/dashboard/meetings/${initial.id}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل حفظ الاجتماع";
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الاجتماع</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="title">عنوان الاجتماع *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
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
            <Label htmlFor="duration">المدة (دقيقة) *</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={720}
              {...register("duration", { valueAsNumber: true })}
            />
            {errors.duration && (
              <p className="text-xs text-red-600">{errors.duration.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingType">نوع الاجتماع *</Label>
            <Select id="meetingType" {...register("meetingType")}>
              {Object.entries(MEETING_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select id="status" {...register("status")}>
                {Object.entries(MEETING_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox {...register("isVirtual")} />
              <span className="text-slate-700">اجتماع افتراضي (عن بُعد)</span>
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">الموقع</Label>
            <Input
              id="location"
              placeholder="عنوان أو غرفة الاجتماع"
              {...register("location")}
            />
          </div>

          {isVirtual && (
            <div className="space-y-2">
              <Label htmlFor="meetingLink">رابط الاجتماع</Label>
              <Input
                id="meetingLink"
                placeholder="https://..."
                {...register("meetingLink")}
              />
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">ملاحظات / جدول الأعمال</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>الحضور</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAttendee}
            >
              <Plus className="size-4" />
              إضافة حاضر
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {attendees.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              لا يوجد حضور حتى الآن
            </p>
          )}
          {attendees.map((a, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-3 rounded-md border border-slate-200 bg-slate-50"
            >
              <div className="space-y-1">
                <Label className="text-xs">عضو الفريق</Label>
                <Select
                  value={a.userId ?? ""}
                  onChange={(e) =>
                    updateAttendee(idx, {
                      userId: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">— خارجي —</option>
                  {team?.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">اسم خارجي</Label>
                <Input
                  value={a.externalName ?? ""}
                  onChange={(e) =>
                    updateAttendee(idx, { externalName: e.target.value })
                  }
                  disabled={!!a.userId}
                  placeholder="اسم الحاضر الخارجي"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">بريد إلكتروني</Label>
                <Input
                  type="email"
                  value={a.externalEmail ?? ""}
                  onChange={(e) =>
                    updateAttendee(idx, { externalEmail: e.target.value })
                  }
                  disabled={!!a.userId}
                  placeholder="email@example.com"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAttendee(idx)}
                aria-label="حذف"
              >
                <X className="size-4 text-red-500" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>محضر الاجتماع</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            value={minutesFile}
            onChange={setMinutesFile}
            label="ارفع ملف محضر الاجتماع (اختياري)"
          />
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
          {mode === "create" ? "جدولة الاجتماع" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
