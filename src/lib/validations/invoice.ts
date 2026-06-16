import { z } from "zod";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

const invoiceStatusEnum = z.enum(
  Object.values(InvoiceStatus) as [InvoiceStatus, ...InvoiceStatus[]],
);
const paymentMethodEnum = z.enum(
  Object.values(PaymentMethod) as [PaymentMethod, ...PaymentMethod[]],
);

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "العميل مطلوب"),
  caseId: z.string().optional().nullable(),
  description: z.string().min(2, "الوصف مطلوب"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  taxIncluded: z.boolean().default(true),
  dueDate: z.coerce.date(),
  notes: z.string().optional().nullable(),
  status: invoiceStatusEnum.optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

const fileUrlSchema = z
  .string()
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
    "رابط الملف غير صحيح",
  );

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  method: paymentMethodEnum,
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paidAt: z.coerce.date().optional(),
  receiptUrl: fileUrlSchema.optional().nullable().or(z.literal("")),
  receiptName: z.string().optional().nullable(),
});

export const invoiceFiltersSchema = z.object({
  q: z.string().optional(),
  status: invoiceStatusEnum.optional(),
  clientId: z.string().optional(),
  caseId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "totalAmount"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>;
