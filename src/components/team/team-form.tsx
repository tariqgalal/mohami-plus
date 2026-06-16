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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { USER_ROLES } from "@/lib/constants";
import {
  createTeamMemberSchema,
  type CreateTeamMemberInput,
} from "@/lib/validations/team";
import {
  useCreateTeamMember,
  useUpdateTeamMember,
} from "@/hooks/use-team-list";
import { toast } from "@/store/toast-store";

const SPECIALIZATIONS = [
  "قضايا تجارية",
  "قضايا عمالية",
  "أحوال شخصية",
  "قضايا جنائية",
  "قضايا إدارية",
  "قضايا عقارية",
  "ملكية فكرية",
  "تأمين",
  "مصرفي",
  "تنفيذ",
];

interface TeamFormProps {
  initial?: Partial<CreateTeamMemberInput> & { id?: string };
  mode: "create" | "edit";
}

export function TeamForm({ initial, mode }: TeamFormProps) {
  const router = useRouter();
  const createMut = useCreateTeamMember();
  const updateMut = useUpdateTeamMember(initial?.id ?? "");
  const [avatar, setAvatar] = useState<UploadedFileInfo | null>(
    initial?.avatar
      ? {
          url: initial.avatar,
          name: "صورة شخصية",
          size: 0,
          type: (initial.avatar.split(".").pop() ?? "file").toLowerCase(),
          mime: null,
        }
      : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamMemberInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTeamMemberSchema) as any,
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      role: initial?.role ?? "LAWYER",
      specialization: initial?.specialization ?? "",
      password: "",
      isActive: initial?.isActive ?? true,
    },
  });

  async function onSubmit(data: CreateTeamMemberInput) {
    const payload = { ...data, avatar: avatar?.url ?? null };
    try {
      if (mode === "create") {
        const created = await createMut.mutateAsync(payload);
        toast.success("تم إضافة العضو بنجاح");
        router.push(`/dashboard/team/${created.id}`);
      } else if (initial?.id) {
        // Edit mode: exclude email + password
        const { email: _e, password: _p, ...editPayload } = payload;
        await updateMut.mutateAsync(editPayload);
        toast.success("تم حفظ التعديلات");
        router.push(`/dashboard/team/${initial.id}`);
      }
    } catch (e: any) {
      toast.error(e.message || "فشل حفظ بيانات العضو");
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
            <Label htmlFor="name">الاسم الكامل *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني *</Label>
            <Input
              id="email"
              type="email"
              disabled={mode === "edit"}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
            {mode === "edit" && (
              <p className="text-xs text-slate-500">
                لا يمكن تعديل البريد الإلكتروني
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input id="phone" placeholder="05xxxxxxxx" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">الدور *</Label>
            <Select id="role" {...register("role")}>
              {Object.entries(USER_ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="specialization">التخصص</Label>
            <Select id="specialization" {...register("specialization")}>
              <option value="">— اختر —</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>

          {mode === "create" && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                placeholder="8 أحرف على الأقل، حرف ورقم"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-slate-500">
                سيستخدمها العضو للدخول إلى النظام
              </p>
            </div>
          )}

          {mode === "edit" && (
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox {...register("isActive")} />
                <span className="text-slate-700">حساب مفعّل</span>
              </label>
              <p className="text-xs text-slate-500">
                عند التعطيل لن يتمكن العضو من تسجيل الدخول
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الصورة الشخصية / رخصة المحاماة</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            value={avatar}
            onChange={setAvatar}
            label="ارفع صورة أو رخصة المحاماة"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            hint="صورة أو PDF (حد أقصى 10MB)"
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
          {mode === "create" ? "إضافة العضو" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
