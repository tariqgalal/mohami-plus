import { z } from "zod";
import { SessionType, SessionStatus } from "@prisma/client";

const sessionTypeEnum = z.enum(
  Object.values(SessionType) as [SessionType, ...SessionType[]],
);
const sessionStatusEnum = z.enum(
  Object.values(SessionStatus) as [SessionStatus, ...SessionStatus[]],
);

const attachmentSchema = z.object({
  url: z
    .string()
    .refine(
      (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
      "رابط الملف غير صحيح",
    ),
  name: z.string().min(1),
  size: z.number().nonnegative(),
  type: z.string().min(1),
});

export const createSessionSchema = z.object({
  caseId: z.string().min(1, "القضية مطلوبة"),
  lawyerId: z.string().min(1, "المحامي مطلوب"),
  date: z.coerce.date(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "الوقت يجب أن يكون بصيغة HH:MM"),
  court: z.string().min(2, "المحكمة مطلوبة"),
  hall: z.string().optional().nullable(),
  judge: z.string().optional().nullable(),
  sessionType: sessionTypeEnum.optional(),
  status: sessionStatusEnum.optional(),
  notes: z.string().optional().nullable(),
  reminder: z.boolean().optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const updateSessionSchema = createSessionSchema.partial();

export const recordResultSchema = z.object({
  result: z.string().min(1, "نتيجة الجلسة مطلوبة"),
  nextAction: z.string().optional().nullable(),
  status: sessionStatusEnum.optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const sessionFiltersSchema = z.object({
  q: z.string().optional(),
  status: sessionStatusEnum.optional(),
  sessionType: sessionTypeEnum.optional(),
  caseId: z.string().optional(),
  lawyerId: z.string().optional(),
  court: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  view: z.enum(["list", "calendar"]).default("list"),
  sortBy: z.enum(["date", "createdAt"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type RecordResultInput = z.infer<typeof recordResultSchema>;
export type SessionFiltersInput = z.infer<typeof sessionFiltersSchema>;
