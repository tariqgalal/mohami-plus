import { z } from "@/lib/zod";
import { CaseType, CaseStatus, Priority } from "@prisma/client";
import { optionalSaudiMobileSchema } from "@/lib/validators";

const caseTypeEnum = z.enum(
  Object.values(CaseType) as [CaseType, ...CaseType[]],
);
const caseStatusEnum = z.enum(
  Object.values(CaseStatus) as [CaseStatus, ...CaseStatus[]],
);
const priorityEnum = z.enum(
  Object.values(Priority) as [Priority, ...Priority[]],
);

/**
 * حقول input[type=date] و input[type=number] الفاضية بترجع "" من المتصفح.
 * z.coerce.date() بيحوّل "" لـ Invalid Date فيفشل التحقق بصمت (الويزارد
 * كان بيرفض ينتقل للخطوة التالية بدون ما يظهر سبب)، و z.coerce.number()
 * بيحوّل "" لـ 0 فيتحفظ مبلغ صفر بدل ما يفضل فاضي. الـ helpers دي بتعامل
 * السلسلة الفاضية كـ null قبل التحويل، وبتثبّت التاريخ على منتصف نهار UTC
 * علشان ما يحصلش انزياح يوم باختلاف المنطقة الزمنية للمستخدم.
 */
const optionalDate = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") {
    const ymd = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
      return new Date(
        Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 12),
      );
    }
  }
  return v;
}, z.coerce.date().nullable().optional());

/** نص اختياري: يحوّل السلسلة الفاضية إلى null بدل تخزين "" في قاعدة البيانات. */
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().nullable().optional(),
);

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().nonnegative().nullable().optional(),
);

export const opponentSchema = z.object({
  name: z.string().min(2, "اسم الخصم مطلوب"),
  type: z.string().optional().nullable(),
  lawyer: z.string().optional().nullable(),
  phone: optionalSaudiMobileSchema,
  notes: z.string().optional().nullable(),
});

export const attachmentSchema = z.object({
  url: z
    .string()
    .min(1)
    .refine(
      (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
      "رابط الملف غير صحيح",
    ),
  name: z.string().min(1),
  size: z.number().nonnegative(),
  type: z.string().min(1),
});

export const createCaseSchema = z.object({
  title: z.string().min(3, "عنوان القضية يجب أن يكون 3 أحرف على الأقل"),
  description: optionalText,
  caseType: caseTypeEnum,
  classification: optionalText,
  lawsuitType: optionalText,
  branch: optionalText,
  establishmentTxnNumber: optionalText,
  court: z.string().min(2, "المحكمة مطلوبة"),
  courtCity: optionalText,
  status: caseStatusEnum.optional(),
  priority: priorityEnum.optional(),
  value: optionalNumber,
  filingDate: optionalDate,
  notes: optionalText,

  clientId: z.string().min(1, "العميل مطلوب"),
  primaryLawyerId: z.string().min(1, "المحامي المسؤول مطلوب"),
  assistantLawyerIds: z.array(z.string()).optional(),

  opponents: z.array(opponentSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const updateCaseSchema = createCaseSchema.partial().extend({
  closingDate: optionalDate,
  result: optionalText,
});

export const caseFiltersSchema = z.object({
  q: z.string().optional(),
  status: caseStatusEnum.optional(),
  caseType: caseTypeEnum.optional(),
  priority: priorityEnum.optional(),
  lawyerId: z.string().optional(),
  clientId: z.string().optional(),
  archived: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => v === true || v === "true"),
  sortBy: z.enum(["createdAt", "updatedAt", "priority", "value"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CaseFiltersInput = z.infer<typeof caseFiltersSchema>;
export type OpponentInput = z.infer<typeof opponentSchema>;
export type AttachmentInput = z.infer<typeof attachmentSchema>;
