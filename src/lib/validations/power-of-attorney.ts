import { z } from "@/lib/zod";
import { POAStatus } from "@prisma/client";
import { attachmentSchema } from "@/lib/validations/case";

const poaStatusEnum = z.enum(
  Object.values(POAStatus) as [POAStatus, ...POAStatus[]],
);

export const createPowerOfAttorneySchema = z
  .object({
    number: z.string().min(1, "رقم الوكالة مطلوب"),
    clientId: z.string().min(1, "العميل مطلوب"),
    startDate: z.coerce.date({ message: "تاريخ البداية مطلوب" }),
    startDateHijri: z.string().min(1, "تاريخ البداية الهجري مطلوب"),
    endDate: z.coerce.date({ message: "تاريخ الانتهاء مطلوب" }),
    endDateHijri: z.string().min(1, "تاريخ الانتهاء الهجري مطلوب"),
    status: poaStatusEnum.optional(),
    notes: z.string().optional().nullable(),
    attachments: z.array(attachmentSchema).optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
    path: ["endDate"],
  });

export const updatePowerOfAttorneySchema = z
  .object({
    number: z.string().min(1, "رقم الوكالة مطلوب").optional(),
    clientId: z.string().min(1, "العميل مطلوب").optional(),
    startDate: z.coerce.date().optional(),
    startDateHijri: z.string().min(1).optional(),
    endDate: z.coerce.date().optional(),
    endDateHijri: z.string().min(1).optional(),
    status: poaStatusEnum.optional(),
    notes: z.string().optional().nullable(),
    attachments: z.array(attachmentSchema).optional(),
  })
  .refine(
    (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
    {
      message: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
      path: ["endDate"],
    },
  );

export const powerOfAttorneyFiltersSchema = z.object({
  q: z.string().optional(),
  status: poaStatusEnum.optional(),
  clientId: z.string().optional(),
  sortBy: z.enum(["createdAt", "endDate", "startDate", "number"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreatePowerOfAttorneyInput = z.infer<
  typeof createPowerOfAttorneySchema
>;
export type UpdatePowerOfAttorneyInput = z.infer<
  typeof updatePowerOfAttorneySchema
>;
export type PowerOfAttorneyFiltersInput = z.infer<
  typeof powerOfAttorneyFiltersSchema
>;
