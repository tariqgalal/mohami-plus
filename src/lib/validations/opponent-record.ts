import { z } from "@/lib/zod";
import { OpponentStatus } from "@prisma/client";

const statusEnum = z.enum(
  Object.values(OpponentStatus) as [OpponentStatus, ...OpponentStatus[]],
);

export const createOpponentSchema = z.object({
  name: z.string().min(1, "اسم الخصم مطلوب"),
  idNumber: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z
    .string()
    .email("بريد إلكتروني غير صحيح")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  caseIds: z.array(z.string()).optional().nullable(),
  status: statusEnum.optional(),
});

export const updateOpponentSchema = createOpponentSchema.partial();

export const opponentFiltersSchema = z.object({
  q: z.string().optional(),
  status: statusEnum.optional(),
  sortBy: z.enum(["createdAt", "number", "name"]).default("number"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateOpponentInput = z.infer<typeof createOpponentSchema>;
export type UpdateOpponentInput = z.infer<typeof updateOpponentSchema>;
export type OpponentFiltersInput = z.infer<typeof opponentFiltersSchema>;
