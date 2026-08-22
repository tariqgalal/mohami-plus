import { z } from "@/lib/zod";
import { DocCategory } from "@prisma/client";

const categoryEnum = z.enum(
  Object.values(DocCategory) as [DocCategory, ...DocCategory[]],
);

const fileUrlSchema = z
  .string()
  .min(1, "رابط الملف مطلوب")
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
    "رابط الملف غير صحيح",
  );

export const createDocumentSchema = z.object({
  name: z.string().min(2, "اسم المستند مطلوب"),
  description: z.string().optional().nullable(),
  fileUrl: fileUrlSchema,
  fileType: z.string().min(1, "نوع الملف مطلوب"),
  fileSize: z.coerce.number().min(0).default(0),
  category: categoryEnum.default("OTHER"),
  caseId: z.string().optional().nullable(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentFiltersSchema = z.object({
  q: z.string().optional(),
  category: categoryEnum.optional(),
  caseId: z.string().optional(),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;
