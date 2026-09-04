import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TASK_TEMPLATES } from "@/lib/constants";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFiltersInput,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
} from "@/lib/validations/task";
import { NotFoundError } from "@/lib/errors";
import {
  notifyTaskAssigned,
  notifyTaskCompleted,
} from "@/services/notification-service";

interface Assignee {
  id: string;
  name: string;
}

/** يستخرج معرّفات المكلّفين من عمود assignedTo (JSON) */
function assigneeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((a) => (a && typeof a === "object" ? (a as Assignee).id : null))
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

async function userName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return user?.name ?? "أحد أعضاء الفريق";
}

export async function listTasks(tenantId: string, filters: TaskFiltersInput) {
  const where: Prisma.TaskWhereInput = { tenantId };

  if (filters.priority) where.priority = filters.priority;
  if (filters.status) where.status = filters.status;
  if (filters.projectType) where.projectType = filters.projectType;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { clientName: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  // فلترة حسب المكلّف (assignedTo هو JSON array)
  if (filters.assigneeId) {
    where.assignedTo = {
      array_contains: [{ id: filters.assigneeId }],
    };
  }

  const orderBy: Prisma.TaskOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

/** عدد المهام حسب كل حالة (للتابات) */
export async function countTasksByStatus(tenantId: string) {
  const rows = await prisma.task.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

export async function getTask(tenantId: string, id: string) {
  return prisma.task.findFirst({ where: { id, tenantId } });
}

async function resolveClientName(
  tenantId: string,
  clientId: string | null | undefined,
): Promise<string | null> {
  if (!clientId) return null;
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { name: true },
  });
  if (!client) throw new NotFoundError("العميل غير موجود");
  return client.name;
}

export async function createTask(
  tenantId: string,
  userId: string,
  input: CreateTaskInput,
) {
  const clientName = await resolveClientName(tenantId, input.clientId);

  const created = await prisma.$transaction(async (tx) => {
    const agg = await tx.task.aggregate({
      where: { tenantId },
      _max: { number: true },
    });
    const number = (agg._max.number ?? 0) + 1;

    const created = await tx.task.create({
      data: {
        tenantId,
        number,
        createdById: userId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "NORMAL",
        status: input.status ?? "PENDING",
        projectType: input.projectType ?? "NONE",
        caseId: input.caseId ?? null,
        clientId: input.clientId ?? null,
        clientName,
        assignedTo: (input.assignedTo ?? undefined) as Prisma.InputJsonValue,
        dueDate: input.dueDate ?? null,
        dueDateHijri: input.dueDateHijri ?? null,
        isConfidential: input.isConfidential ?? false,
        completedWithoutAssignment: input.completedWithoutAssignment ?? false,
        reply: input.reply ?? null,
        attachments: (input.attachments ?? undefined) as Prisma.InputJsonValue,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "task",
        entityId: created.id,
        details: JSON.stringify({
          number: created.number,
          title: created.title,
        }),
      },
    });

    return created;
  });

  // إشعار المكلّفين بالمهمة الجديدة (ما عدا من أنشأها)
  const recipients = assigneeIds(created.assignedTo).filter(
    (id) => id !== userId,
  );
  if (recipients.length) {
    await notifyTaskAssigned({
      tenantId,
      taskId: created.id,
      taskTitle: created.title,
      assigneeIds: recipients,
      assignerName: await userName(userId),
    });
  }

  return created;
}

export async function updateTask(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateTaskInput,
) {
  const existing = await prisma.task.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      title: true,
      status: true,
      assignedTo: true,
      createdById: true,
    },
  });
  if (!existing) return null;

  const clientName =
    input.clientId !== undefined
      ? await resolveClientName(tenantId, input.clientId)
      : undefined;

  const updatedTask = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
        projectType: input.projectType,
        caseId: input.caseId,
        clientId: input.clientId,
        clientName,
        assignedTo:
          input.assignedTo === undefined
            ? undefined
            : (input.assignedTo as Prisma.InputJsonValue),
        dueDate: input.dueDate,
        dueDateHijri: input.dueDateHijri,
        isConfidential: input.isConfidential,
        completedWithoutAssignment: input.completedWithoutAssignment,
        reply: input.reply,
        attachments:
          input.attachments === undefined
            ? undefined
            : (input.attachments as Prisma.InputJsonValue),
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "task",
        entityId: id,
      },
    });

    return updated;
  });

  // مكلّفون جدد أُضيفوا في هذا التعديل
  if (input.assignedTo !== undefined) {
    const previous = new Set(assigneeIds(existing.assignedTo));
    const newlyAssigned = assigneeIds(updatedTask.assignedTo).filter(
      (uid) => !previous.has(uid) && uid !== userId,
    );
    if (newlyAssigned.length) {
      await notifyTaskAssigned({
        tenantId,
        taskId: id,
        taskTitle: updatedTask.title,
        assigneeIds: newlyAssigned,
        assignerName: await userName(userId),
      });
    }
  }

  // اكتملت المهمة → إشعار منشئها ومديري المكتب
  if (
    input.status === "COMPLETED" &&
    existing.status !== "COMPLETED"
  ) {
    const admins = await prisma.user.findMany({
      where: { tenantId, role: "FIRM_ADMIN", isActive: true },
      select: { id: true },
    });
    const recipients = Array.from(
      new Set([
        ...(existing.createdById ? [existing.createdById] : []),
        ...admins.map((a) => a.id),
      ]),
    ).filter((uid) => uid !== userId);

    if (recipients.length) {
      await notifyTaskCompleted({
        tenantId,
        taskId: id,
        taskTitle: updatedTask.title,
        recipientIds: recipients,
        completedByName: await userName(userId),
      });
    }
  }

  return updatedTask;
}

export async function deleteTask(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.task.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "task",
        entityId: id,
      },
    });
  });

  return { id };
}

/** تشغيل/إيقاف عدّاد الوقت للمهمة */
export async function toggleTaskTimer(
  tenantId: string,
  userId: string,
  id: string,
  action: "start" | "stop",
) {
  const task = await prisma.task.findFirst({
    where: { id, tenantId },
    select: { id: true, timeSpent: true, timerStartedAt: true },
  });
  if (!task) return null;

  if (action === "start") {
    // إذا كان يعمل بالفعل، لا تُعِد التصفير
    if (task.timerStartedAt) return prisma.task.findFirst({ where: { id } });
    return prisma.task.update({
      where: { id },
      data: { timerStartedAt: new Date() },
    });
  }

  // action === "stop"
  if (!task.timerStartedAt) return prisma.task.findFirst({ where: { id } });
  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - task.timerStartedAt.getTime()) / 1000),
  );
  return prisma.task.update({
    where: { id },
    data: {
      timeSpent: task.timeSpent + elapsed,
      timerStartedAt: null,
    },
  });
}

// ============ الردود الجاهزة (Task Templates) ============

/** يُنشئ الردود الافتراضية عند أول استخدام إن لم توجد أي ردود للمكتب */
async function ensureDefaultTemplates(tenantId: string) {
  const count = await prisma.taskTemplate.count({ where: { tenantId } });
  if (count > 0) return;
  await prisma.taskTemplate.createMany({
    data: DEFAULT_TASK_TEMPLATES.map((text, i) => ({
      tenantId,
      text,
      sortOrder: i,
    })),
  });
}

export async function listTaskTemplates(tenantId: string) {
  await ensureDefaultTemplates(tenantId);
  return prisma.taskTemplate.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createTaskTemplate(
  tenantId: string,
  input: CreateTaskTemplateInput,
) {
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const agg = await prisma.taskTemplate.aggregate({
      where: { tenantId },
      _max: { sortOrder: true },
    });
    sortOrder = (agg._max.sortOrder ?? -1) + 1;
  }
  return prisma.taskTemplate.create({
    data: { tenantId, text: input.text, sortOrder },
  });
}

export async function updateTaskTemplate(
  tenantId: string,
  id: string,
  input: UpdateTaskTemplateInput,
) {
  const existing = await prisma.taskTemplate.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.taskTemplate.update({
    where: { id },
    data: { text: input.text, sortOrder: input.sortOrder },
  });
}

export async function deleteTaskTemplate(tenantId: string, id: string) {
  const existing = await prisma.taskTemplate.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;
  await prisma.taskTemplate.delete({ where: { id } });
  return { id };
}

export type { Assignee };
