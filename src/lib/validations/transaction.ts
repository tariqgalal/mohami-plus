import { z } from "@/lib/zod";
import { TransactionDirection, TransactionStatus } from "@prisma/client";

const directionEnum = z.enum(
  Object.values(TransactionDirection) as [
    TransactionDirection,
    ...TransactionDirection[],
  ],
);
const statusEnum = z.enum(
  Object.values(TransactionStatus) as [
    TransactionStatus,
    ...TransactionStatus[],
  ],
);

/** تاريخ اختياري يتقبّل السلسلة الفارغة القادمة من النموذج ويحوّلها إلى null */
const optionalDate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.date().nullable(),
);

export const createTransactionSchema = z.object({
  registryNumber: z.string().min(1, "رقم القيد مطلوب"),
  subject: z.string().min(1, "موضوع المعاملة مطلوب"),
  direction: directionEnum,
  receiveDate: optionalDate,
  receiveDateHijri: z.string().optional().nullable(),
  sendDate: optionalDate,
  sendDateHijri: z.string().optional().nullable(),
  senderName: z.string().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: statusEnum.optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFiltersSchema = z.object({
  q: z.string().optional(),
  direction: directionEnum.optional(),
  status: statusEnum.optional(),
  sortBy: z
    .enum(["createdAt", "registryNumber", "receiveDate", "sendDate"])
    .default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;
