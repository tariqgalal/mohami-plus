import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCaseNumber } from "@/lib/format";
import {
  notifyCaseAssigned,
  notifyCaseStatusChanged,
} from "@/services/notification-service";
import { CASE_STATUS_ALL } from "@/lib/constants";
import type {
  CreateCaseInput,
  UpdateCaseInput,
  CaseFiltersInput,
} from "@/lib/validations/case";
import { AppError } from "@/lib/errors";

export async function listCases(tenantId: string, filters: CaseFiltersInput) {
  const where: Prisma.CaseWhereInput = { tenantId };

  // الأرشيف: افتراضياً نعرض القضايا غير المؤرشفة فقط
  where.archivedAt = filters.archived ? { not: null } : null;

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { caseNumber: { contains: filters.q, mode: "insensitive" } },
      { client: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.caseType) where.caseType = filters.caseType;
  if (filters.priority) where.priority = filters.priority;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.lawyerId) {
    where.lawyers = { some: { userId: filters.lawyerId } };
  }

  const orderBy: Prisma.CaseOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.case.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        client: { select: { id: true, name: true, clientType: true } },
        lawyers: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { sessions: true, documents: true } },
      },
    }),
    prisma.case.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getCase(tenantId: string, id: string) {
  return prisma.case.findFirst({
    where: { id, tenantId },
    include: {
      client: true,
      createdBy: { select: { id: true, name: true, avatar: true } },
      lawyers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
              specialization: true,
            },
          },
        },
      },
      opponents: true,
      sessions: {
        orderBy: { date: "desc" },
        include: {
          lawyer: { select: { id: true, name: true } },
        },
      },
      documents: { orderBy: { createdAt: "desc" } },
      invoices: {
        orderBy: { createdAt: "desc" },
        include: { payments: true },
      },
      activities: {
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      _count: {
        select: {
          sessions: true,
          documents: true,
          invoices: true,
        },
      },
    },
  });
}

async function nextCaseNumber(tenantId: string) {
  const year = new Date().getFullYear();
  const prefix = `QD-${year}-`;
  const last = await prisma.case.findFirst({
    where: { tenantId, caseNumber: { startsWith: prefix } },
    orderBy: { caseNumber: "desc" },
    select: { caseNumber: true },
  });
  const lastSeq = last
    ? Number(last.caseNumber.split("-")[2]) || 0
    : 0;
  return generateCaseNumber(year, lastSeq + 1);
}

export async function createCase(
  tenantId: string,
  userId: string,
  input: CreateCaseInput,
) {
  const { assertCanAddCase } = await import("@/lib/plan-limits");
  await assertCanAddCase(tenantId);

  const caseNumber = await nextCaseNumber(tenantId);

  const created = await prisma.$transaction(async (tx) => {
    const newCase = await tx.case.create({
      data: {
        tenantId,
        createdById: userId,
        caseNumber,
        title: input.title,
        description: input.description ?? null,
        caseType: input.caseType,
        classification: input.classification ?? null,
        lawsuitType: input.lawsuitType ?? null,
        branch: input.branch ?? null,
        establishmentTxnNumber: input.establishmentTxnNumber ?? null,
        court: input.court,
        courtCity: input.courtCity ?? null,
        status: input.status ?? "OPEN",
        priority: input.priority ?? "MEDIUM",
        value: input.value ?? null,
        filingDate: input.filingDate ?? null,
        notes: input.notes ?? null,
        clientId: input.clientId,
        lawyers: {
          create: [
            { userId: input.primaryLawyerId, isPrimary: true },
            ...(input.assistantLawyerIds ?? [])
              .filter((id) => id !== input.primaryLawyerId)
              .map((userId) => ({ userId, isPrimary: false })),
          ],
        },
        opponents: input.opponents?.length
          ? {
              create: input.opponents.map((o) => ({
                name: o.name,
                type: o.type ?? null,
                lawyer: o.lawyer ?? null,
                phone: o.phone ?? null,
                notes: o.notes ?? null,
              })),
            }
          : undefined,
      },
    });

    if (input.attachments?.length) {
      await tx.document.createMany({
        data: input.attachments.map((a) => ({
          tenantId,
          caseId: newCase.id,
          name: a.name,
          fileUrl: a.url,
          fileType: a.type,
          fileSize: a.size,
          category: "OTHER",
        })),
      });
    }

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "case",
        entityId: newCase.id,
        caseId: newCase.id,
        details: JSON.stringify({ title: newCase.title }),
      },
    });

    return newCase;
  });

  const assignedUserIds = Array.from(
    new Set([
      input.primaryLawyerId,
      ...(input.assistantLawyerIds ?? []),
    ]),
  ).filter((id) => id !== userId);
  await notifyCaseAssigned({
    tenantId,
    caseId: created.id,
    caseTitle: created.title,
    userIds: assignedUserIds,
  });

  return created;
}

export async function updateCase(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateCaseInput,
) {
  const existing = await prisma.case.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      status: true,
      title: true,
      lawyers: { select: { userId: true } },
    },
  });
  if (!existing) return null;

  const updatedCase = await prisma.$transaction(async (tx) => {
    const updated = await tx.case.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        caseType: input.caseType,
        classification: input.classification,
        lawsuitType: input.lawsuitType,
        branch: input.branch,
        establishmentTxnNumber: input.establishmentTxnNumber,
        court: input.court,
        courtCity: input.courtCity,
        status: input.status,
        priority: input.priority,
        value: input.value,
        filingDate: input.filingDate,
        closingDate: input.closingDate,
        result: input.result,
        notes: input.notes,
        ...(input.clientId ? { clientId: input.clientId } : {}),
      },
    });

    if (input.primaryLawyerId || input.assistantLawyerIds) {
      await tx.caseLawyer.deleteMany({ where: { caseId: id } });
      const all = new Set<string>([
        ...(input.primaryLawyerId ? [input.primaryLawyerId] : []),
        ...(input.assistantLawyerIds ?? []),
      ]);
      await tx.caseLawyer.createMany({
        data: Array.from(all).map((userId) => ({
          caseId: id,
          userId,
          isPrimary: userId === input.primaryLawyerId,
        })),
      });
    }

    if (input.opponents) {
      await tx.opponent.deleteMany({ where: { caseId: id } });
      if (input.opponents.length) {
        await tx.opponent.createMany({
          data: input.opponents.map((o) => ({
            caseId: id,
            name: o.name,
            type: o.type ?? null,
            lawyer: o.lawyer ?? null,
            phone: o.phone ?? null,
            notes: o.notes ?? null,
          })),
        });
      }
    }

    if (input.attachments?.length) {
      await tx.document.createMany({
        data: input.attachments.map((a) => ({
          tenantId,
          caseId: id,
          name: a.name,
          fileUrl: a.url,
          fileType: a.type,
          fileSize: a.size,
          category: "OTHER",
        })),
      });
    }

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "case",
        entityId: id,
        caseId: id,
      },
    });

    return updated;
  });

  // محامون أُضيفوا للقضية في هذا التعديل → إشعار تعيين
  if (input.primaryLawyerId || input.assistantLawyerIds) {
    const previous = new Set(existing.lawyers.map((l) => l.userId));
    const newlyAssigned = Array.from(
      new Set([
        ...(input.primaryLawyerId ? [input.primaryLawyerId] : []),
        ...(input.assistantLawyerIds ?? []),
      ]),
    ).filter((uid) => !previous.has(uid) && uid !== userId);

    if (newlyAssigned.length) {
      await notifyCaseAssigned({
        tenantId,
        caseId: id,
        caseTitle: input.title ?? existing.title,
        userIds: newlyAssigned,
      });
    }
  }

  if (input.status && input.status !== existing.status) {
    const statusLabel =
      CASE_STATUS_ALL[input.status as keyof typeof CASE_STATUS_ALL] ??
      input.status;
    const oldStatusLabel =
      CASE_STATUS_ALL[existing.status as keyof typeof CASE_STATUS_ALL] ??
      existing.status;
    // كل المحامين المعيّنين + مديري المكتب (ما عدا من نفّذ التغيير)
    const admins = await prisma.user.findMany({
      where: { tenantId, role: "FIRM_ADMIN", isActive: true },
      select: { id: true },
    });
    const notifyIds = Array.from(
      new Set([
        ...existing.lawyers.map((l) => l.userId),
        ...admins.map((a) => a.id),
      ]),
    ).filter((uid) => uid !== userId);
    await notifyCaseStatusChanged({
      tenantId,
      caseId: id,
      caseTitle: existing.title,
      oldStatusLabel,
      newStatusLabel: statusLabel,
      userIds: notifyIds,
    });
  }

  return updatedCase;
}

export async function deleteCase(
  _tenantId: string,
  _userId: string,
  _id: string,
) {
  throw new AppError("الحذف النهائي للقضايا غير مدعوم");
}

/** عدد القضايا (غير المؤرشفة) حسب كل حالة — للتابات */
export async function countCasesByStatus(tenantId: string) {
  const rows = await prisma.case.groupBy({
    by: ["status"],
    where: { tenantId, archivedAt: null },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    counts[r.status] = r._count._all;
    total += r._count._all;
  }
  return { counts, total };
}

/** أرشفة / إلغاء أرشفة قضية */
export async function setCaseArchived(
  tenantId: string,
  userId: string,
  id: string,
  archived: boolean,
) {
  const existing = await prisma.case.findFirst({
    where: { id, tenantId },
    select: { id: true, title: true },
  });
  if (!existing) return null;

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.case.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: archived ? "archived" : "unarchived",
        entity: "case",
        entityId: id,
        caseId: id,
      },
    });
    return c;
  });

  return updated;
}
