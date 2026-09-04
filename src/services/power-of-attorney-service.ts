import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreatePowerOfAttorneyInput,
  UpdatePowerOfAttorneyInput,
  PowerOfAttorneyFiltersInput,
} from "@/lib/validations/power-of-attorney";
import { NotFoundError } from "@/lib/errors";
import { notifyPoaCreated } from "@/services/notification-service";

export async function listPowersOfAttorney(
  tenantId: string,
  filters: PowerOfAttorneyFiltersInput,
) {
  const where: Prisma.PowerOfAttorneyWhereInput = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.q) {
    where.OR = [
      { number: { contains: filters.q, mode: "insensitive" } },
      { client: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  const orderBy: Prisma.PowerOfAttorneyOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.powerOfAttorney.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        client: { select: { id: true, name: true, clientType: true, phone: true } },
      },
    }),
    prisma.powerOfAttorney.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

/** عدد الوكالات حسب كل حالة (للتابات) */
export async function countPowersOfAttorneyByStatus(tenantId: string) {
  const rows = await prisma.powerOfAttorney.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

export async function getPowerOfAttorney(tenantId: string, id: string) {
  return prisma.powerOfAttorney.findFirst({
    where: { id, tenantId },
    include: {
      client: {
        select: { id: true, name: true, clientType: true, phone: true, city: true },
      },
    },
  });
}

function idArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

/** يجلب الوكالة مع أسماء الجهات المرتبطة (موظفين، قضايا، تنفيذ، استشارات) */
export async function getPowerOfAttorneyWithRelations(
  tenantId: string,
  id: string,
) {
  const poa = await getPowerOfAttorney(tenantId, id);
  if (!poa) return null;

  const employeeIds = idArray(poa.employeeIds);
  const caseIds = idArray(poa.caseIds);
  const executionIds = idArray(poa.executionIds);
  const consultationIds = idArray(poa.consultationIds);

  const [employees, cases, executions, consultations] = await Promise.all([
    employeeIds.length
      ? prisma.user.findMany({
          where: { tenantId, id: { in: employeeIds } },
          select: { id: true, name: true },
        })
      : [],
    caseIds.length
      ? prisma.case.findMany({
          where: { tenantId, id: { in: caseIds } },
          select: { id: true, caseNumber: true, title: true },
        })
      : [],
    executionIds.length
      ? prisma.case.findMany({
          where: { tenantId, id: { in: executionIds } },
          select: { id: true, caseNumber: true, title: true },
        })
      : [],
    consultationIds.length
      ? prisma.consultation.findMany({
          where: { tenantId, id: { in: consultationIds } },
          select: { id: true, number: true, title: true },
        })
      : [],
  ]);

  return { poa, relations: { employees, cases, executions, consultations } };
}

export async function createPowerOfAttorney(
  tenantId: string,
  userId: string,
  input: CreatePowerOfAttorneyInput,
) {
  // تأكد أن العميل يخص نفس المكتب
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, tenantId },
    select: { id: true, name: true },
  });
  if (!client) throw new NotFoundError("العميل غير موجود");

  const created = await prisma.$transaction(async (tx) => {
    const poa = await tx.powerOfAttorney.create({
      data: {
        tenantId,
        clientId: input.clientId,
        number: input.number,
        startDate: input.startDate,
        startDateHijri: input.startDateHijri,
        endDate: input.endDate,
        endDateHijri: input.endDateHijri,
        status: input.status ?? "ACTIVE",
        notes: input.notes ?? null,
        attachments: input.attachments?.length
          ? (input.attachments as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        employeeIds: (input.employeeIds ??
          []) as unknown as Prisma.InputJsonValue,
        caseIds: (input.caseIds ?? []) as unknown as Prisma.InputJsonValue,
        executionIds: (input.executionIds ??
          []) as unknown as Prisma.InputJsonValue,
        consultationIds: (input.consultationIds ??
          []) as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "power_of_attorney",
        entityId: poa.id,
        details: JSON.stringify({ number: poa.number }),
      },
    });

    return poa;
  });

  // إشعار الموظفين المخوّلين بالوكالة (ما عدا من أنشأها)
  const authorizedIds = (input.employeeIds ?? []).filter(
    (empId): empId is string => typeof empId === "string" && empId !== userId,
  );
  if (authorizedIds.length) {
    await notifyPoaCreated({
      tenantId,
      poaId: created.id,
      poaNumber: created.number,
      clientName: client.name,
      recipientIds: authorizedIds,
    });
  }

  return created;
}

export async function updatePowerOfAttorney(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdatePowerOfAttorneyInput,
) {
  const existing = await prisma.powerOfAttorney.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, tenantId },
      select: { id: true },
    });
    if (!client) throw new NotFoundError("العميل غير موجود");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const poa = await tx.powerOfAttorney.update({
      where: { id },
      data: {
        number: input.number,
        clientId: input.clientId,
        startDate: input.startDate,
        startDateHijri: input.startDateHijri,
        endDate: input.endDate,
        endDateHijri: input.endDateHijri,
        status: input.status,
        notes: input.notes,
        ...(input.attachments
          ? {
              attachments: input.attachments.length
                ? (input.attachments as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            }
          : {}),
        ...(input.employeeIds
          ? {
              employeeIds:
                input.employeeIds as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(input.caseIds
          ? { caseIds: input.caseIds as unknown as Prisma.InputJsonValue }
          : {}),
        ...(input.executionIds
          ? {
              executionIds:
                input.executionIds as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(input.consultationIds
          ? {
              consultationIds:
                input.consultationIds as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "power_of_attorney",
        entityId: id,
      },
    });

    return poa;
  });

  return updated;
}

export async function deletePowerOfAttorney(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.powerOfAttorney.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.powerOfAttorney.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "power_of_attorney",
        entityId: id,
      },
    });
  });

  return { id };
}
