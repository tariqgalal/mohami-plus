import { z } from "@/lib/zod";
import { BorrowingStatus } from "@prisma/client";

const statusEnum = z.enum(
  Object.values(BorrowingStatus) as [BorrowingStatus, ...BorrowingStatus[]],
);

/** تاريخ اختياري يتقبّل السلسلة الفارغة القادمة من النموذج ويحوّلها إلى null */
const optionalDate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.date().nullable(),
);

export const createBorrowingSchema = z.object({
  employeeId: z.string().min(1, "الموظف مطلوب"),
  documentSource: z.string().min(1, "مصدر الوثيقة مطلوب"),
  documentType: z.string().min(1, "نوع الوثيقة مطلوب"),
  documentName: z.string().min(1, "اسم/رقم الوثيقة مطلوب"),
  description: z.string().optional().nullable(),
  borrowDate: z.coerce.date({ message: "تاريخ الاستعارة مطلوب" }),
  borrowDateHijri: z.string().optional().nullable(),
  returnDate: optionalDate,
  returnDateHijri: z.string().optional().nullable(),
  status: statusEnum.optional(),
});

export const updateBorrowingSchema = createBorrowingSchema.partial();

export const borrowingFiltersSchema = z.object({
  q: z.string().optional(),
  status: statusEnum.optional(),
  employeeId: z.string().optional(),
  sortBy: z.enum(["createdAt", "borrowDate", "returnDate"]).default("borrowDate"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateBorrowingInput = z.infer<typeof createBorrowingSchema>;
export type UpdateBorrowingInput = z.infer<typeof updateBorrowingSchema>;
export type BorrowingFiltersInput = z.infer<typeof borrowingFiltersSchema>;
