import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifySessionCreated } from "@/services/notification-service";
import { formatDate } from "@/lib/format";
import type {
  CreateSessionInput,
  UpdateSessionInput,
  SessionFiltersInput,
  RecordResultInput,
} from "@/lib/validations/session";
import { NotFoundError } from "@/lib/errors";

export async function listSessions(
  tenantId: string,
  filters: SessionFiltersInput,
) {
  const where: Prisma.CourtSessionWhereInput = { tenantId };

  if (filters.q) {
    where.OR = [
      { court: { contains: filters.q, mode: "insensitive" } },
      { case: { title: { contains: filters.q, mode: "insensitive" } } },
      { case: { caseNumber: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.sessionType) where.sessionType = filters.sessionType;
  if (filters.caseId) where.caseId = filters.caseId;
  if (filters.lawyerId) where.lawyerId = filters.lawyerId;
  if (filters.court) where.court = filters.court;
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = filters.from;
    if (filters.to) where.date.lte = filters.to;
  }

  const orderBy: Prisma.CourtSessionOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  // في عرض الكالندر نطلع كل السجلات بدون pagination
  const isCalendar = filters.view === "calendar";

  const [items, total] = await Promise.all([
    prisma.courtSession.findMany({
      where,
      orderBy,
      skip: isCalendar ? 0 : (filters.page - 1) * filters.limit,
      take: isCalendar ? 500 : filters.limit,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            client: { select: { id: true, name: true } },
          },
        },
        lawyer: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    }),
    prisma.courtSession.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getSession(tenantId: string, id: string) {
  return prisma.courtSession.findFirst({
    where: { id, tenantId },
    include: {
      case: {
        select: {
          id: true,
          caseNumber: true,
          title: true,
          status: true,
          client: { select: { id: true, name: true } },
        },
      },
      lawyer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          specialization: true,
        },
      },
    },
  });
}

export async function createSession(
  tenantId: string,
  userId: string,
  input: CreateSessionInput,
) {
  const caseExists = await prisma.case.findFirst({
    where: { id: input.caseId, tenantId },
    select: { id: true },
  });
  if (!caseExists) throw new NotFoundError("القضية غير موجودة");

  const created = await prisma.$transaction(async (tx) => {
    const session = await tx.courtSession.create({
      data: {
        tenantId,
        caseId: input.caseId,
        lawyerId: input.lawyerId,
        date: input.date,
        time: input.time,
        court: input.court,
        hall: input.hall ?? null,
        judge: input.judge ?? null,
        sessionType: input.sessionType ?? "HEARING",
        status: input.status ?? "SCHEDULED",
        notes: input.notes ?? null,
        reminder: input.reminder ?? true,
      },
      include: {
        case: { select: { title: true } },
      },
    });

    if (input.attachments?.length) {
      await tx.document.createMany({
        data: input.attachments.map((a) => ({
          tenantId,
          caseId: input.caseId,
          name: a.name,
          fileUrl: a.url,
          fileType: a.type,
          fileSize: a.size,
          category: "COURT_DOCUMENT",
        })),
      });
    }

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "session",
        entityId: session.id,
        caseId: input.caseId,
      },
    });
    return session;
  });

  // كل المحامين المعيّنين على القضية + محامي الجلسة (ما عدا منشئ الجلسة)
  const caseLawyers = await prisma.caseLawyer.findMany({
    where: { caseId: input.caseId },
    select: { userId: true },
  });
  const recipientIds = Array.from(
    new Set([...caseLawyers.map((l) => l.userId), input.lawyerId]),
  ).filter((uid) => uid && uid !== userId);

  if (recipientIds.length) {
    await notifySessionCreated({
      tenantId,
      sessionId: created.id,
      caseTitle: created.case.title,
      court: created.court,
      dateLabel: `${formatDate(created.date)} — ${created.time}`,
      recipientIds,
    });
  }

  return created;
}

export async function updateSession(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateSessionInput,
) {
  const existing = await prisma.courtSession.findFirst({
    where: { id, tenantId },
    select: { id: true, caseId: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.courtSession.update({
      where: { id },
      data: {
        date: input.date,
        time: input.time,
        court: input.court,
        hall: input.hall,
        judge: input.judge,
        sessionType: input.sessionType,
        status: input.status,
        notes: input.notes,
        reminder: input.reminder,
        ...(input.lawyerId ? { lawyerId: input.lawyerId } : {}),
      },
    });

    if (input.attachments?.length) {
      await tx.document.createMany({
        data: input.attachments.map((a) => ({
          tenantId,
          caseId: existing.caseId,
          name: a.name,
          fileUrl: a.url,
          fileType: a.type,
          fileSize: a.size,
          category: "COURT_DOCUMENT",
        })),
      });
    }

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "session",
        entityId: id,
        caseId: existing.caseId,
      },
    });
    return updated;
  });
}

export async function recordSessionResult(
  tenantId: string,
  userId: string,
  id: string,
  input: RecordResultInput,
) {
  const existing = await prisma.courtSession.findFirst({
    where: { id, tenantId },
    select: { id: true, caseId: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.courtSession.update({
      where: { id },
      data: {
        result: input.result,
        nextAction: input.nextAction ?? null,
        status: input.status ?? "COMPLETED",
      },
    });

    if (input.attachments?.length) {
      await tx.document.createMany({
        data: input.attachments.map((a) => ({
          tenantId,
          caseId: existing.caseId,
          name: a.name,
          fileUrl: a.url,
          fileType: a.type,
          fileSize: a.size,
          category: "COURT_DOCUMENT",
        })),
      });
    }

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "result_recorded",
        entity: "session",
        entityId: id,
        caseId: existing.caseId,
        details: JSON.stringify({ result: input.result.slice(0, 200) }),
      },
    });
    return updated;
  });
}

export async function deleteSession(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.courtSession.findFirst({
    where: { id, tenantId },
    select: { id: true, caseId: true },
  });
  if (!existing) return null;

  await prisma.$transaction([
    prisma.courtSession.update({ where: { id }, data: { status: "CANCELLED" } }),
    prisma.activity.create({
      data: {
        tenantId,
        userId,
        action: "cancelled",
        entity: "session",
        entityId: id,
        caseId: existing.caseId,
      },
    }),
  ]);
  return existing;
}

export async function getDashboardSessions(tenantId: string) {
  const now = new Date();
  const upcoming = await prisma.courtSession.findMany({
    where: {
      tenantId,
      status: "SCHEDULED",
      date: { gte: now },
    },
    orderBy: { date: "asc" },
    take: 5,
    include: {
      case: { select: { id: true, caseNumber: true, title: true } },
      lawyer: { select: { id: true, name: true } },
    },
  });
  return upcoming;
}
