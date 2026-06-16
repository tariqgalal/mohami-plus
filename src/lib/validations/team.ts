import { z } from "zod";
import { UserRole } from "@prisma/client";

const roleEnum = z.enum(Object.values(UserRole) as [UserRole, ...UserRole[]]);

const fileUrlSchema = z
  .string()
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
    "رابط الملف غير صحيح",
  );

export const createTeamMemberSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.email("البريد الإلكتروني غير صحيح"),
  phone: z.string().optional().nullable(),
  role: roleEnum,
  specialization: z.string().optional().nullable(),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف")
    .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم"),
  isActive: z.boolean().optional(),
  avatar: fileUrlSchema.optional().nullable().or(z.literal("")),
});

export const updateTeamMemberSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  role: roleEnum.optional(),
  specialization: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  avatar: fileUrlSchema.optional().nullable().or(z.literal("")),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف")
    .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم"),
});

export const teamFiltersSchema = z.object({
  q: z.string().optional(),
  role: roleEnum.optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TeamFiltersInput = z.infer<typeof teamFiltersSchema>;
