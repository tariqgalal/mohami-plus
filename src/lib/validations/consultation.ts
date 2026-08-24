import { z } from "@/lib/zod";
import { ConsultationType, ConsultationStatus } from "@prisma/client";

const typeEnum = z.enum(
  Object.values(ConsultationType) as [ConsultationType, ...ConsultationType[]],
);

const statusEnum = z.enum(
  Object.values(ConsultationStatus) as [
    ConsultationStatus,
    ...ConsultationStatus[],
  ],
);

const assignee = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const createConsultationSchema = z.object({
  title: z.string().min(1, "اسم الاستشارة مطلوب"),
  type: typeEnum.default("LEGAL_CONSULTATION"),
  clientId: z.string().optional().nullable(),
  assignedTo: z.array(assignee).optional().nullable(),
  date: z.coerce.date({ message: "تاريخ الاستشارة مطلوب" }),
  dateHijri: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: statusEnum.optional(),
  attachments: z.array(z.any()).optional().nullable(),
});

export const updateConsultationSchema = createConsultationSchema.partial();

export const consultationFiltersSchema = z.object({
  q: z.string().optional(),
  type: typeEnum.optional(),
  status: statusEnum.optional(),
  clientId: z.string().optional(),
  sortBy: z.enum(["createdAt", "date", "number"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
export type ConsultationFiltersInput = z.infer<
  typeof consultationFiltersSchema
>;
