import { z } from "zod";
import { CaseType, CaseStatus, Priority } from "@prisma/client";

const caseTypeEnum = z.enum(
  Object.values(CaseType) as [CaseType, ...CaseType[]],
);
const caseStatusEnum = z.enum(
  Object.values(CaseStatus) as [CaseStatus, ...CaseStatus[]],
);
const priorityEnum = z.enum(
  Object.values(Priority) as [Priority, ...Priority[]],
);

export const opponentSchema = z.object({
  name: z.string().min(2, "اسم الخصم مطلوب"),
  type: z.string().optional().nullable(),
  lawyer: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
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
  description: z.string().optional().nullable(),
  caseType: caseTypeEnum,
  court: z.string().min(2, "المحكمة مطلوبة"),
  courtCity: z.string().optional().nullable(),
  status: caseStatusEnum.optional(),
  priority: priorityEnum.optional(),
  value: z.coerce.number().nonnegative().optional().nullable(),
  filingDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),

  clientId: z.string().min(1, "العميل مطلوب"),
  primaryLawyerId: z.string().min(1, "المحامي المسؤول مطلوب"),
  assistantLawyerIds: z.array(z.string()).optional(),

  opponents: z.array(opponentSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const updateCaseSchema = createCaseSchema.partial().extend({
  closingDate: z.coerce.date().optional().nullable(),
  result: z.string().optional().nullable(),
});

export const caseFiltersSchema = z.object({
  q: z.string().optional(),
  status: caseStatusEnum.optional(),
  caseType: caseTypeEnum.optional(),
  priority: priorityEnum.optional(),
  lawyerId: z.string().optional(),
  clientId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "priority", "value"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CaseFiltersInput = z.infer<typeof caseFiltersSchema>;
export type OpponentInput = z.infer<typeof opponentSchema>;
export type AttachmentInput = z.infer<typeof attachmentSchema>;
