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
import { LEAVE_TYPE, LEAVE_STATUS } from "@/lib/constants";
import { useTeam } from "@/hooks/use-team";
import {
  useCreateEmployeeLeave,
  useUpdateEmployeeLeave,
} from "@/hooks/use-employee-leaves";
import { toast } from "@/store/toast-store";

interface LeaveInitial {
  id?: string;
  employeeId?: string;
  leaveType?: string;
  startDate?: string | null;
  startDateHijri?: string | null;
  endDate?: string | null;
  endDateHijri?: string | null;
  status?: string;
  notes?: string | null;
}

interface LeaveFormValues {
  employeeId: string;
  leaveType: string;
  startDate: string;
  startDateHijri: string;
  endDate: string;
  endDateHijri: string;
  status: string;
  notes: string;
}

interface EmployeeLeaveFormProps {
  initial?: LeaveInitial;
  mode: "create" | "edit";
}

const RETURN_TO = "/dashboard/hr/leaves";

export function EmployeeLeaveForm({ initial, mode }: EmployeeLeaveFormProps) {
  const router = useRouter();
  const { data: team } = useTeam();
  const createMut = useCreateEmployeeLeave();
  const updateMut = useUpdateEmployeeLeave(initial?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormValues>({
    defaultValues: {
      employeeId: initial?.employeeId ?? "",
      leaveType: initial?.leaveType ?? "ANNUAL",
      startDate: initial?.startDate ?? "",
      startDateHijri: initial?.startDateHijri ?? "",
      endDate: initial?.endDate ?? "",
      endDateHijri: initial?.endDateHijri ?? "",
      status: initial?.status ?? "PENDING",
      notes: initial?.notes ?? "",
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  // معاينة عدد الأيام (شاملاً يومي البداية والنهاية)
  let previewDays = 0;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
      previewDays =
        Math.floor(
          (Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()) -
            Date.UTC(s.getFullYear(), s.getMonth(), s.getDate())) /
            86400000,
        ) + 1;
    }
  }

  async function onSubmit(data: LeaveFormValues) {
    if (!data.startDate || !data.endDate) {
      toast.error("يرجى تحديد تاريخي البداية والنهاية");
      return;
    }
    try {
      const payload = {
        employeeId: data.employeeId,
        leaveType: data.leaveType as
          | "ANNUAL"
          | "SICK"
          | "EMERGENCY"
          | "UNPAID"
          | "OTHER",
        startDate: data.startDate,
        startDateHijri: data.startDateHijri,
        endDate: data.endDate,
        endDateHijri: data.endDateHijri,
        status: data.status as "PENDING" | "APPROVED" | "REJECTED",
        notes: data.notes || null,
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMut.mutateAsync(payload as any);
        toast.success("تم تسجيل الإجازة بنجاح");
        router.push(RETURN_TO);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(RETURN_TO);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ الإجازة");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الإجازة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">الموظف *</Label>
            <Select id="employeeId" {...register("employeeId", { required: true })}>
              <option value="">— اختر الموظف —</option>
              {team?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            {errors.employeeId && (
              <p className="text-xs text-red-600">الموظف مطلوب</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveType">نوع الإجازة *</Label>
            <Select id="leaveType" {...register("leaveType")}>
              {Object.entries(LEAVE_TYPE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>من (هجري) *</Label>
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
              <p className="text-xs text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>إلى (هجري) *</Label>
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
            <Label>عدد الأيام</Label>
            <div className="h-10 flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 tabular-nums">
              {previewDays > 0 ? `${previewDays} يوم` : "—"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select id="status" {...register("status")}>
              {Object.entries(LEAVE_STATUS).map(([k, v]) => (
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
              placeholder="أي ملاحظات على الإجازة..."
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
          {mode === "create" ? "تسجيل الإجازة" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
