import { z } from "@/lib/zod";
import {
  CorrespondenceCategory,
  CorrespondenceType,
  CorrespondenceDirection,
} from "@prisma/client";

const categoryEnum = z.enum(
  Object.values(CorrespondenceCategory) as [
    CorrespondenceCategory,
    ...CorrespondenceCategory[],
  ],
);
const typeEnum = z.enum(
  Object.values(CorrespondenceType) as [
    CorrespondenceType,
    ...CorrespondenceType[],
  ],
);
const directionEnum = z.enum(
  Object.values(CorrespondenceDirection) as [
    CorrespondenceDirection,
    ...CorrespondenceDirection[],
  ],
);

const attachmentSchema = z.object({
  url: z.string(),
  name: z.string(),
  size: z.number().optional(),
  type: z.string().optional(),
  mime: z.string().nullable().optional(),
});

export const createCorrespondenceSchema = z.object({
  subject: z.string().min(1, "الموضوع مطلوب"),
  body: z.string().min(1, "المحتوى مطلوب"),
  category: categoryEnum,
  type: typeEnum,
  direction: directionEnum.default("OUTGOING"),
  recipientIds: z.array(z.string()).min(1, "اختر مستلماً واحداً على الأقل"),
  attachments: z.array(attachmentSchema).optional(),
  dateHijri: z.string().optional().nullable(),
  date: z.coerce.date().optional(),
  parentId: z.string().optional().nullable(),
});

export const updateCorrespondenceSchema = createCorrespondenceSchema
  .partial()
  .omit({ parentId: true });

export const correspondenceFiltersSchema = z.object({
  q: z.string().optional(),
  type: typeEnum.optional(),
  direction: directionEnum.optional(),
  category: categoryEnum.optional(),
  sortBy: z.enum(["date", "createdAt", "serialNumber"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateCorrespondenceInput = z.infer<
  typeof createCorrespondenceSchema
>;
export type UpdateCorrespondenceInput = z.infer<
  typeof updateCorrespondenceSchema
>;
export type CorrespondenceFiltersInput = z.infer<
  typeof correspondenceFiltersSchema
>;
