"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updateTenantSchema,
  type UpdateTenantInput,
} from "@/lib/validations/settings";
import { SAUDI_CITIES } from "@/lib/constants";
import { toast } from "@/store/toast-store";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";

interface Tenant {
  id: string;
  name: string;
  licenseNumber: string | null;
  email: string;
  phone: string | null;
  city: string;
  address: string | null;
  plan: string;
  status: string;
  logo: string | null;
}

interface TenantFormProps {
  canEdit: boolean;
}

export function TenantForm({ canEdit }: TenantFormProps) {
  const qc = useQueryClient();
  const [logo, setLogo] = useState<UploadedFileInfo | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["tenant"],
    queryFn: async () => {
      const res = await fetch("/api/tenant");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data as Tenant;
    },
  });

  const mutation = useMutation({
    mutationFn: async (input: UpdateTenantInput) => {
      const res = await fetch("/api/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant"] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTenantInput>({
    resolver: zodResolver(updateTenantSchema),
    values: data
      ? {
          name: data.name,
          licenseNumber: data.licenseNumber ?? "",
          email: data.email,
          phone: data.phone ?? "",
          city: data.city,
          address: data.address ?? "",
        }
      : undefined,
  });

  useEffect(() => {
    if (data?.logo) {
      setLogo({
        url: data.logo,
        name: "شعار",
        size: 0,
        type: (data.logo.split(".").pop() ?? "file").toLowerCase(),
        mime: null,
      });
    }
  }, [data?.logo]);

  async function onSubmit(values: UpdateTenantInput) {
    try {
      await mutation.mutateAsync({ ...values, logo: logo?.url ?? null });
      toast.success("تم حفظ بيانات المكتب");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل الحفظ";
      toast.error(msg);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        جاري التحميل...
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>بيانات المكتب</CardTitle>
        {!canEdit && (
          <p className="text-xs text-slate-500 mt-1">
            عرض فقط — فقط مدير المكتب يستطيع التعديل
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المكتب *</Label>
            <Input id="name" disabled={!canEdit} {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">رقم الترخيص</Label>
            <Input
              id="licenseNumber"
              disabled={!canEdit}
              {...register("licenseNumber")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني *</Label>
            <Input
              id="email"
              type="email"
              disabled={!canEdit}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" disabled={!canEdit} {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">المدينة *</Label>
            <Select id="city" disabled={!canEdit} {...register("city")}>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              rows={2}
              disabled={!canEdit}
              {...register("address")}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label>شعار المكتب</Label>
            <FileUpload
              value={logo}
              onChange={setLogo}
              label="ارفع شعار المكتب"
              accept=".jpg,.jpeg,.png,.webp,.svg"
              hint="صورة (حد أقصى 10MB) — تظهر في الفواتير والتقارير"
              disabled={!canEdit}
            />
          </div>

          {canEdit && (
            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                تراجع
              </Button>
              <Button type="submit" loading={isSubmitting}>
                حفظ
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
