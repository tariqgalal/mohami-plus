import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const registerFirmSchema = z
  .object({
    firmName: z.string().min(2, "اسم المكتب يجب أن يكون حرفين على الأقل"),
    firmEmail: z.email("البريد الإلكتروني غير صحيح"),
    firmPhone: z.string().min(9, "رقم الهاتف غير صحيح"),
    city: z.string().min(2, "المدينة مطلوبة"),
    licenseNumber: z.string().optional(),

    adminName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
    adminEmail: z.email("البريد الإلكتروني غير صحيح"),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف")
      .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم"),
    confirmPassword: z.string(),

    plan: z.enum(["BASIC", "PROFESSIONAL", "ENTERPRISE"]),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, "يجب الموافقة على الشروط والأحكام"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمة المرور غير متطابقة",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterFirmInput = z.infer<typeof registerFirmSchema>;
