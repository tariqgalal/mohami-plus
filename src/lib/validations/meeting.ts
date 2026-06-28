import { z } from "zod";
import { MeetingType, MeetingStatus } from "@prisma/client";
import { optionalEmailSchema } from "@/lib/validators";

const meetingTypeEnum = z.enum(
  Object.values(MeetingType) as [MeetingType, ...MeetingType[]],
);
const meetingStatusEnum = z.enum(
  Object.values(MeetingStatus) as [MeetingStatus, ...MeetingStatus[]],
);

export const attendeeSchema = z.object({
  userId: z.string().optional().nullable(),
  externalName: z.string().optional().nullable(),
  externalEmail: optionalEmailSchema,
});

const fileUrlSchema = z
  .string()
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/uploads/"),
    "رابط الملف غير صحيح",
  );

export const createMeetingSchema = z.object({
  title: z.string().min(2, "العنوان مطلوب"),
  date: z.coerce.date(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "الوقت يجب أن يكون بصيغة HH:MM"),
  duration: z.coerce.number().min(5, "المدة 5 دقائق على الأقل").max(720),
  meetingType: meetingTypeEnum,
  location: z.string().optional().nullable(),
  isVirtual: z.boolean().optional(),
  meetingLink: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: meetingStatusEnum.optional(),
  attendees: z.array(attendeeSchema).optional(),
  minutesUrl: fileUrlSchema.optional().nullable().or(z.literal("")),
  minutesName: z.string().optional().nullable(),
});

export const recordMinutesSchema = z.object({
  notes: z.string().min(1, "محضر الاجتماع مطلوب"),
  minutesUrl: fileUrlSchema.optional().nullable().or(z.literal("")),
  minutesName: z.string().optional().nullable(),
});

export const updateMeetingSchema = createMeetingSchema.partial();

export const meetingFiltersSchema = z.object({
  q: z.string().optional(),
  status: meetingStatusEnum.optional(),
  meetingType: meetingTypeEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sortBy: z.enum(["date", "createdAt"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type MeetingFiltersInput = z.infer<typeof meetingFiltersSchema>;
export type RecordMinutesInput = z.infer<typeof recordMinutesSchema>;
