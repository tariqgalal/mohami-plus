import { z } from "@/lib/zod";

export const attachmentOwnerSchema = z.object({
  caseId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  meetingId: z.string().optional().nullable(),
});

export const createLinkAttachmentSchema = attachmentOwnerSchema.extend({
  url: z
    .string()
    .min(1, "الرابط مطلوب")
    .refine((v) => /^https?:\/\//i.test(v.trim()), {
      message: "يجب أن يبدأ الرابط بـ http:// أو https://",
    }),
  label: z.string().max(200).optional().nullable(),
});

export type CreateLinkAttachmentInput = z.infer<
  typeof createLinkAttachmentSchema
>;

export const attachmentFilterSchema = attachmentOwnerSchema;
export type AttachmentFilter = z.infer<typeof attachmentFilterSchema>;
