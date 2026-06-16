"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/settings";
import { toast } from "@/store/toast-store";
import {
  FileUpload,
  type UploadedFileInfo,
} from "@/components/shared/file-upload";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  role: string;
  avatar: string | null;
}

export function ProfileForm() {
  const qc = useQueryClient();
  const [avatar, setAvatar] = useState<UploadedFileInfo | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data as Profile;
    },
  });

  const mutation = useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: data
      ? {
          name: data.name,
          phone: data.phone ?? "",
          specialization: data.specialization ?? "",
        }
      : undefined,
  });

  useEffect(() => {
    if (data?.avatar) {
      setAvatar({
        url: data.avatar,
        name: "صورة شخصية",
        size: 0,
        type: (data.avatar.split(".").pop() ?? "file").toLowerCase(),
        mime: null,
      });
    }
  }, [data?.avatar]);

  async function onSubmit(values: UpdateProfileInput) {
    try {
      await mutation.mutateAsync({ ...values, avatar: avatar?.url ?? null });
      toast.success("تم حفظ الملف الشخصي");
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
        <CardTitle>الملف الشخصي</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={data?.email ?? ""} disabled />
            <p className="text-xs text-slate-500">
              لا يمكن تغيير البريد بعد التسجيل
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input id="phone" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">التخصص</Label>
            <Input
              id="specialization"
              placeholder="مثال: قضايا تجارية"
              {...register("specialization")}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label>الصورة الشخصية</Label>
            <FileUpload
              value={avatar}
              onChange={setAvatar}
              label="ارفع صورة شخصية"
              accept=".jpg,.jpeg,.png,.webp"
            />
          </div>

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
        </form>
      </CardContent>
    </Card>
  );
}
