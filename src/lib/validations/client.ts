import { z } from "zod";
import { ClientType, ClientStatus } from "@prisma/client";

const clientTypeEnum = z.enum(
  Object.values(ClientType) as [ClientType, ...ClientType[]],
);
const clientStatusEnum = z.enum(
  Object.values(ClientStatus) as [ClientStatus, ...ClientStatus[]],
);

const fileUrlSchema = z
  .string()
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
    "رابط الملف غير صحيح",
  );

export const createClientSchema = z.object({
  name: z.string().min(2, "اسم العميل يجب أن يكون حرفين على الأقل"),
  clientType: clientTypeEnum,
  contactPerson: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z.string().min(9, "رقم الجوال يجب أن يكون 9 أرقام على الأقل"),
  secondaryPhone: z.string().optional().nullable(),
  city: z.string().min(2, "المدينة مطلوبة"),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: clientStatusEnum.optional(),
  idDocumentUrl: fileUrlSchema.optional().nullable().or(z.literal("")),
  idDocumentName: z.string().optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientFiltersSchema = z.object({
  q: z.string().optional(),
  clientType: clientTypeEnum.optional(),
  status: clientStatusEnum.optional(),
  city: z.string().optional(),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientFiltersInput = z.infer<typeof clientFiltersSchema>;
