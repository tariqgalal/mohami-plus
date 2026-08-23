import { z } from "@/lib/zod";
import { RequestSource, ServiceRequestStatus } from "@prisma/client";
import { optionalEmailSchema, optionalSaudiMobileSchema } from "@/lib/validators";

const sourceEnum = z.enum(
  Object.values(RequestSource) as [RequestSource, ...RequestSource[]],
);
const statusEnum = z.enum(
  Object.values(ServiceRequestStatus) as [
    ServiceRequestStatus,
    ...ServiceRequestStatus[],
  ],
);

export const createServiceRequestSchema = z.object({
  source: sourceEnum,
  requestType: z.string().min(1, "نوع الطلب مطلوب"),
  requestSubType: z.string().optional().nullable(),
  description: z.string().min(1, "وصف الطلب مطلوب"),
  applicantName: z.string().min(1, "اسم مقدم الطلب مطلوب"),
  applicantPhone: optionalSaudiMobileSchema,
  applicantEmail: optionalEmailSchema,
  status: statusEnum.optional(),
  assignedTo: z.string().optional().nullable(),
  dateHijri: z.string().optional().nullable(),
  date: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
});

export const updateServiceRequestSchema = createServiceRequestSchema.partial();

export const serviceRequestFiltersSchema = z.object({
  q: z.string().optional(),
  status: statusEnum.optional(),
  source: sourceEnum.optional(),
  sortBy: z.enum(["date", "createdAt", "applicantName"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateServiceRequestInput = z.infer<
  typeof createServiceRequestSchema
>;
export type UpdateServiceRequestInput = z.infer<
  typeof updateServiceRequestSchema
>;
export type ServiceRequestFiltersInput = z.infer<
  typeof serviceRequestFiltersSchema
>;
