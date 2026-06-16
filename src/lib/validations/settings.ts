import { z } from "zod";

const fileUrlSchema = z
  .string()
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
    "رابط الملف غير صحيح",
  );

export const updateProfileSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  avatar: fileUrlSchema.optional().nullable().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const updateTenantSchema = z.object({
  name: z.string().min(2, "اسم المكتب مطلوب"),
  licenseNumber: z.string().optional().nullable(),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  phone: z.string().optional().nullable(),
  city: z.string().min(2, "المدينة مطلوبة"),
  address: z.string().optional().nullable(),
  logo: fileUrlSchema.optional().nullable().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
