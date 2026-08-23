"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { OPPONENT_STATUS } from "@/lib/constants";
import { useCreateOpponent, useUpdateOpponent } from "@/hooks/use-opponents";
import { toast } from "@/store/toast-store";

interface OpponentInitial {
  id?: string;
  name?: string;
  idNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: string;
}

interface OpponentFormValues {
  name: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  notes: string;
}

interface OpponentFormProps {
  initial?: OpponentInitial;
  mode: "create" | "edit";
  returnTo: string;
}

export function OpponentForm({
  initial,
  mode,
  returnTo,
}: OpponentFormProps) {
  const router = useRouter();
  const createMut = useCreateOpponent();
  const updateMut = useUpdateOpponent(initial?.id ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OpponentFormValues>({
    defaultValues: {
      name: initial?.name ?? "",
      idNumber: initial?.idNumber ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      address: initial?.address ?? "",
      status: initial?.status ?? "ACTIVE",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(data: OpponentFormValues) {
    try {
      const payload = {
        name: data.name,
        idNumber: data.idNumber || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        status: data.status as "ACTIVE" | "ARCHIVED",
        notes: data.notes || null,
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMut.mutateAsync(payload as any);
        toast.success("تم إضافة الخصم بنجاح");
        router.push(returnTo);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(returnTo);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ الخصم");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الخصم</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="name">اسم الخصم *</Label>
            <Input
              id="name"
              placeholder="اسم الخصم (فرد / شركة / جهة)"
              {...register("name", { required: true })}
            />
            {errors.name && (
              <p className="text-xs text-red-600">اسم الخصم مطلوب</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">رقم الهوية / السجل التجاري</Label>
            <Input
              id="idNumber"
              placeholder="1xxxxxxxxx"
              {...register("idNumber")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input
              id="phone"
              placeholder="05xxxxxxxx"
              dir="ltr"
              className="text-right"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="opponent@example.com"
              dir="ltr"
              className="text-right"
              {...register("email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select id="status" {...register("status")}>
              {Object.entries(OPPONENT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              placeholder="المدينة، الحي، العنوان التفصيلي"
              {...register("address")}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="أي ملاحظات إضافية عن الخصم..."
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
          {mode === "create" ? "إضافة الخصم" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
