"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CLIENT_TYPES,
  CLIENT_STATUS,
  SAUDI_CITIES,
} from "@/lib/constants";
import {
  createClientSchema,
  type CreateClientInput,
} from "@/lib/validations/client";
import {
  useCreateClient,
  useUpdateClient,
} from "@/hooks/use-clients-list";
import { toast } from "@/store/toast-store";

interface ClientFormProps {
  initial?: Partial<CreateClientInput> & { id?: string };
  mode: "create" | "edit";
}

export function ClientForm({ initial, mode }: ClientFormProps) {
  const router = useRouter();
  const createMut = useCreateClient();
  const updateMut = useUpdateClient(initial?.id ?? "");
  const [idDoc, setIdDoc] = useState<UploadedFileInfo | null>(
    initial?.idDocumentUrl
      ? {
          url: initial.idDocumentUrl,
          name: initial.idDocumentName ?? "وثيقة",
          size: 0,
          type: (initial.idDocumentName ?? "").split(".").pop() ?? "file",
          mime: null,
        }
      : null,
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: {
      name: initial?.name ?? "",
      clientType: initial?.clientType ?? "INDIVIDUAL",
      contactPerson: initial?.contactPerson ?? "",
      nationalId: initial?.nationalId ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      secondaryPhone: initial?.secondaryPhone ?? "",
      city: initial?.city ?? "",
      address: initial?.address ?? "",
      notes: initial?.notes ?? "",
      status: initial?.status ?? "ACTIVE",
    },
  });

  const clientType = watch("clientType");
  const isOrg = clientType !== "INDIVIDUAL";

  async function onSubmit(data: CreateClientInput) {
    const payload = {
      ...data,
      idDocumentUrl: idDoc?.url ?? null,
      idDocumentName: idDoc?.name ?? null,
    };
    try {
      if (mode === "create") {
        const created = await createMut.mutateAsync(payload);
        toast.success("تم إضافة العميل بنجاح");
        router.push(`/dashboard/clients/${created.id}`);
      } else if (initial?.id) {
        await updateMut.mutateAsync(payload);
        toast.success("تم حفظ التعديلات");
        router.push(`/dashboard/clients/${initial.id}`);
      }
    } catch (e: any) {
      toast.error(e.message || "فشل حفظ بيانات العميل");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientType">نوع العميل *</Label>
            <Select id="clientType" {...register("clientType")}>
              {Object.entries(CLIENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {isOrg ? "اسم الجهة *" : "اسم العميل *"}
            </Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {isOrg && (
            <div className="space-y-2">
              <Label htmlFor="contactPerson">جهة التواصل</Label>
              <Input id="contactPerson" {...register("contactPerson")} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nationalId">
              {isOrg ? "السجل التجاري" : "رقم الهوية الوطنية"}
            </Label>
            <Input id="nationalId" {...register("nationalId")} />
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select id="status" {...register("status")}>
                {Object.entries(CLIENT_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات التواصل</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال *</Label>
            <Input
              id="phone"
              placeholder="05xxxxxxxx"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryPhone">رقم إضافي</Label>
            <Input id="secondaryPhone" {...register("secondaryPhone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">المدينة *</Label>
            <Select id="city" {...register("city")}>
              <option value="">— اختر المدينة —</option>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            {errors.city && (
              <p className="text-xs text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="address">العنوان التفصيلي</Label>
            <Input id="address" {...register("address")} />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isOrg ? "صورة السجل التجاري" : "صورة الهوية"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            value={idDoc}
            onChange={setIdDoc}
            label={isOrg ? "ارفع السجل التجاري" : "ارفع صورة الهوية"}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            hint="PDF أو صورة (حد أقصى 10MB)"
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
          {mode === "create" ? "إضافة العميل" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
