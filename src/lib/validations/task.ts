import { z } from "@/lib/zod";
import { TaskPriority, TaskStatus, TaskProjectType } from "@prisma/client";

const priorityEnum = z.enum(
  Object.values(TaskPriority) as [TaskPriority, ...TaskPriority[]],
);

const statusEnum = z.enum(
  Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]],
);

const projectTypeEnum = z.enum(
  Object.values(TaskProjectType) as [TaskProjectType, ...TaskProjectType[]],
);

const assignee = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "عنوان المهمة مطلوب"),
  description: z.string().optional().nullable(),
  priority: priorityEnum.default("NORMAL"),
  status: statusEnum.optional(),
  projectType: projectTypeEnum.default("NONE"),
  caseId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  assignedTo: z.array(assignee).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  dueDateHijri: z.string().optional().nullable(),
  isConfidential: z.boolean().optional(),
  completedWithoutAssignment: z.boolean().optional(),
  reply: z.string().optional().nullable(),
  attachments: z.array(z.any()).optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFiltersSchema = z.object({
  q: z.string().optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  projectType: projectTypeEnum.optional(),
  assigneeId: z.string().optional(),
  clientId: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "number", "priority"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
});

export const timerActionSchema = z.object({
  action: z.enum(["start", "stop"]),
});

// ============ الردود الجاهزة ============

export const createTaskTemplateSchema = z.object({
  text: z.string().min(1, "نص الرد مطلوب"),
  sortOrder: z.coerce.number().optional(),
});

export const updateTaskTemplateSchema = z.object({
  text: z.string().min(1, "نص الرد مطلوب").optional(),
  sortOrder: z.coerce.number().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
export type TimerActionInput = z.infer<typeof timerActionSchema>;
export type CreateTaskTemplateInput = z.infer<typeof createTaskTemplateSchema>;
export type UpdateTaskTemplateInput = z.infer<typeof updateTaskTemplateSchema>;
