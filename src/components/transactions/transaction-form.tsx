"use client";

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
import { TRANSACTION_DIRECTION, TRANSACTION_STATUS } from "@/lib/constants";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { toast } from "@/store/toast-store";

interface TransactionInitial {
  id?: string;
  registryNumber?: string;
  subject?: string;
  direction?: string;
  receiveDate?: string | null;
  receiveDateHijri?: string | null;
  sendDate?: string | null;
  sendDateHijri?: string | null;
  senderName?: string | null;
  recipientName?: string | null;
  department?: string | null;
  status?: string;
  notes?: string | null;
}

interface TransactionFormValues {
  registryNumber: string;
  subject: string;
  direction: string;
  date: string;
  dateHijri: string;
  partyName: string;
  department: string;
  status: string;
  notes: string;
}

interface TransactionFormProps {
  initial?: TransactionInitial;
  mode: "create" | "edit";
  /** الاتجاه الافتراضي عند الإنشاء من صفحة الوارد/الصادر */
  defaultDirection?: "INCOMING" | "OUTGOING";
  /** المسار الذي يُعاد إليه بعد الحفظ */
  returnTo: string;
}

export function TransactionForm({
  initial,
  mode,
  defaultDirection = "INCOMING",
  returnTo,
}: TransactionFormProps) {
  const router = useRouter();
  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction(initial?.id ?? "");

  const initialDirection = initial?.direction ?? defaultDirection;
  const isIncomingInitial = initialDirection === "INCOMING";

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    defaultValues: {
      registryNumber: initial?.registryNumber ?? "",
      subject: initial?.subject ?? "",
      direction: initialDirection,
      date:
        (isIncomingInitial ? initial?.receiveDate : initial?.sendDate) ?? "",
      dateHijri:
        (isIncomingInitial
          ? initial?.receiveDateHijri
          : initial?.sendDateHijri) ?? "",
      partyName:
        (isIncomingInitial ? initial?.senderName : initial?.recipientName) ??
        "",
      department: initial?.department ?? "",
      status: initial?.status ?? "ACTIVE",
      notes: initial?.notes ?? "",
    },
  });

  const direction = watch("direction");
  const isIncoming = direction === "INCOMING";

  async function onSubmit(data: TransactionFormValues) {
    try {
      const payload = {
        registryNumber: data.registryNumber,
        subject: data.subject,
        direction: data.direction as "INCOMING" | "OUTGOING",
        receiveDate: isIncoming ? data.date || null : null,
        receiveDateHijri: isIncoming ? data.dateHijri || null : null,
        sendDate: !isIncoming ? data.date || null : null,
        sendDateHijri: !isIncoming ? data.dateHijri || null : null,
        senderName: isIncoming ? data.partyName || null : null,
        recipientName: !isIncoming ? data.partyName || null : null,
        department: data.department || null,
        status: data.status as "ACTIVE" | "ARCHIVED",
        notes: data.notes || null,
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMut.mutateAsync(payload as any);
        toast.success("تم إضافة المعاملة بنجاح");
        router.push(returnTo);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(returnTo);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ المعاملة");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات المعاملة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="registryNumber">رقم القيد *</Label>
            <Input
              id="registryNumber"
              placeholder="مثال: 1445-101"
              {...register("registryNumber", { required: true })}
            />
            {errors.registryNumber && (
              <p className="text-xs text-red-600">رقم القيد مطلوب</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direction">النوع *</Label>
            <Select id="direction" {...register("direction")}>
              {Object.entries(TRANSACTION_DIRECTION).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="subject">موضوع المعاملة *</Label>
            <Input
              id="subject"
              placeholder="موضوع المعاملة"
              {...register("subject", { required: true })}
            />
            {errors.subject && (
              <p className="text-xs text-red-600">موضوع المعاملة مطلوب</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{isIncoming ? "تاريخ الاستلام (هجري)" : "تاريخ الإرسال (هجري)"}</Label>
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
            <Label htmlFor="partyName">{isIncoming ? "المرسِل" : "المستلِم"}</Label>
            <Input
              id="partyName"
              placeholder={isIncoming ? "اسم الجهة المرسِلة" : "اسم الجهة المستلِمة"}
              {...register("partyName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">القسم</Label>
            <Input
              id="department"
              placeholder="القسم المختص"
              {...register("department")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select id="status" {...register("status")}>
              {Object.entries(TRANSACTION_STATUS).map(([k, v]) => (
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
              placeholder="أي ملاحظات إضافية..."
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
          {mode === "create" ? "إضافة المعاملة" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
