import { z } from "@/lib/zod";
import { LeaveType, LeaveStatus } from "@prisma/client";

const typeEnum = z.enum(
  Object.values(LeaveType) as [LeaveType, ...LeaveType[]],
);
const statusEnum = z.enum(
  Object.values(LeaveStatus) as [LeaveStatus, ...LeaveStatus[]],
);

export const createEmployeeLeaveSchema = z
  .object({
    employeeId: z.string().min(1, "الموظف مطلوب"),
    leaveType: typeEnum,
    startDate: z.coerce.date({ message: "تاريخ البداية مطلوب" }),
    startDateHijri: z.string().min(1, "تاريخ البداية الهجري مطلوب"),
    endDate: z.coerce.date({ message: "تاريخ النهاية مطلوب" }),
    endDateHijri: z.string().min(1, "تاريخ النهاية الهجري مطلوب"),
    status: statusEnum.optional(),
    notes: z.string().optional().nullable(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو مساوياً له",
    path: ["endDate"],
  });

export const updateEmployeeLeaveSchema = z
  .object({
    employeeId: z.string().min(1).optional(),
    leaveType: typeEnum.optional(),
    startDate: z.coerce.date().optional(),
    startDateHijri: z.string().min(1).optional(),
    endDate: z.coerce.date().optional(),
    endDateHijri: z.string().min(1).optional(),
    status: statusEnum.optional(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
    {
      message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو مساوياً له",
      path: ["endDate"],
    },
  );

export const employeeLeaveFiltersSchema = z.object({
  q: z.string().optional(),
  employeeId: z.string().optional(),
  leaveType: typeEnum.optional(),
  status: statusEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sortBy: z.enum(["startDate", "createdAt", "employeeName"]).default("startDate"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export type CreateEmployeeLeaveInput = z.infer<
  typeof createEmployeeLeaveSchema
>;
export type UpdateEmployeeLeaveInput = z.infer<
  typeof updateEmployeeLeaveSchema
>;
export type EmployeeLeaveFiltersInput = z.infer<
  typeof employeeLeaveFiltersSchema
>;
