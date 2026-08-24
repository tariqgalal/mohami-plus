import { z } from "@/lib/zod";
import {
  JudgmentLevel,
  JudgmentResult,
  ObjectionStatus,
} from "@prisma/client";

const levelEnum = z.enum(
  Object.values(JudgmentLevel) as [JudgmentLevel, ...JudgmentLevel[]],
);

const resultEnum = z.enum(
  Object.values(JudgmentResult) as [JudgmentResult, ...JudgmentResult[]],
);

const objectionEnum = z.enum(
  Object.values(ObjectionStatus) as [ObjectionStatus, ...ObjectionStatus[]],
);

/** تاريخ اختياري يتقبّل السلسلة الفارغة القادمة من النموذج ويحوّلها إلى null */
const optionalDate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.date().nullable(),
);

export const createJudgmentSchema = z.object({
  caseId: z.string().min(1, "القضية مطلوبة"),
  judgmentLevel: levelEnum.default("FIRST_INSTANCE"),
  judgmentResult: resultEnum.default("PARTIAL"),
  judgmentSummary: z.string().optional().nullable(),
  receiveDate: optionalDate,
  receiveDateHijri: z.string().optional().nullable(),
  objectionStatus: objectionEnum.default("PENDING"),
  objectionDeadline: optionalDate,
  notes: z.string().optional().nullable(),
  attachments: z.array(z.any()).optional().nullable(),
});

export const updateJudgmentSchema = createJudgmentSchema.partial();

export const judgmentFiltersSchema = z.object({
  q: z.string().optional(),
  objectionStatus: objectionEnum.optional(),
  judgmentLevel: levelEnum.optional(),
  caseId: z.string().optional(),
  sortBy: z.enum(["createdAt", "receiveDate"]).default("receiveDate"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateJudgmentInput = z.infer<typeof createJudgmentSchema>;
export type UpdateJudgmentInput = z.infer<typeof updateJudgmentSchema>;
export type JudgmentFiltersInput = z.infer<typeof judgmentFiltersSchema>;
