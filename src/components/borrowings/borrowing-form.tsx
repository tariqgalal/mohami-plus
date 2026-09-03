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
import { BORROWING_STATUS } from "@/lib/constants";
import { useTeam } from "@/hooks/use-team";
import {
  useCreateBorrowing,
  useUpdateBorrowing,
} from "@/hooks/use-borrowings";
import { toast } from "@/store/toast-store";

interface BorrowingInitial {
  id?: string;
  employeeId?: string;
  documentSource?: string;
  documentType?: string;
  documentName?: string;
  description?: string | null;
  borrowDate?: string | null;
  borrowDateHijri?: string | null;
  returnDate?: string | null;
  returnDateHijri?: string | null;
  status?: string;
}

interface BorrowingFormValues {
  employeeId: string;
  documentSource: string;
  documentType: string;
  documentName: string;
  description: string;
  borrowDate: string;
  borrowDateHijri: string;
  returnDate: string;
  returnDateHijri: string;
  status: string;
}

interface BorrowingFormProps {
  initial?: BorrowingInitial;
  mode: "create" | "edit";
}

const RETURN_TO = "/dashboard/borrowings";

export function BorrowingForm({ initial, mode }: BorrowingFormProps) {
  const router = useRouter();
  const { data: team } = useTeam();
  const createMut = useCreateBorrowing();
  const updateMut = useUpdateBorrowing(initial?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BorrowingFormValues>({
    defaultValues: {
      employeeId: initial?.employeeId ?? "",
      documentSource: initial?.documentSource ?? "",
      documentType: initial?.documentType ?? "",
      documentName: initial?.documentName ?? "",
      description: initial?.description ?? "",
      borrowDate: initial?.borrowDate ?? "",
      borrowDateHijri: initial?.borrowDateHijri ?? "",
      returnDate: initial?.returnDate ?? "",
      returnDateHijri: initial?.returnDateHijri ?? "",
      status: initial?.status ?? "PENDING",
    },
  });

  async function onSubmit(data: BorrowingFormValues) {
    if (!data.borrowDate) {
      toast.error("يرجى تحديد تاريخ الاستعارة");
      return;
    }
    try {
      const payload = {
        employeeId: data.employeeId,
        documentSource: data.documentSource,
        documentType: data.documentType,
        documentName: data.documentName,
        description: data.description || null,
        borrowDate: data.borrowDate,
        borrowDateHijri: data.borrowDateHijri || null,
        returnDate: data.returnDate || null,
        returnDateHijri: data.returnDateHijri || null,
        status: data.status as
          | "PENDING"
          | "DELIVERED"
          | "RETURNED"
          | "REJECTED",
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMut.mutateAsync(payload as any);
        toast.success("تم تسجيل الاستعارة بنجاح");
        router.push(RETURN_TO);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(RETURN_TO);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ الاستعارة");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الاستعارة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">الموظف *</Label>
            <Select
              id="employeeId"
              {...register("employeeId", { required: true })}
            >
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
            <Label htmlFor="documentSource">مصدر الوثيقة *</Label>
            <Input
              id="documentSource"
              placeholder="مثال: أرشيف القضايا، ملف العميل..."
              {...register("documentSource", { required: true })}
            />
            {errors.documentSource && (
              <p className="text-xs text-red-600">مصدر الوثيقة مطلوب</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">نوع الوثيقة *</Label>
            <Input
              id="documentType"
              placeholder="مثال: عقد، صك، توكيل..."
              {...register("documentType", { required: true })}
            />
            {errors.documentType && (
              <p className="text-xs text-red-600">نوع الوثيقة مطلوب</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentName">اسم/رقم الوثيقة *</Label>
            <Input
              id="documentName"
              placeholder="اسم الوثيقة أو رقمها"
              {...register("documentName", { required: true })}
            />
            {errors.documentName && (
              <p className="text-xs text-red-600">اسم/رقم الوثيقة مطلوب</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>تاريخ الاستعارة *</Label>
            <Controller
              control={control}
              name="borrowDate"
              render={({ field }) => (
                <HijriDatePicker
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v.gregorian ?? "");
                    setValue("borrowDateHijri", v.hijri ?? "");
                  }}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>تاريخ الإرجاع</Label>
            <Controller
              control={control}
              name="returnDate"
              render={({ field }) => (
                <HijriDatePicker
                  value={field.value || null}
                  onChange={(v) => {
                    field.onChange(v.gregorian ?? "");
                    setValue("returnDateHijri", v.hijri ?? "");
                  }}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select id="status" {...register("status")}>
              {Object.entries(BORROWING_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="وصف الوثيقة أو سبب الاستعارة..."
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
          {mode === "create" ? "تسجيل الاستعارة" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
