import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateConsultationInput,
  UpdateConsultationInput,
  ConsultationFiltersInput,
} from "@/lib/validations/consultation";

export async function listConsultations(
  tenantId: string,
  filters: ConsultationFiltersInput,
) {
  const where: Prisma.ConsultationWhereInput = { tenantId };

  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { clientName: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ConsultationOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.consultation.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

/** عدد الاستشارات حسب كل حالة (للتابات) */
export async function countConsultationsByStatus(tenantId: string) {
  const rows = await prisma.consultation.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

export async function getConsultation(tenantId: string, id: string) {
  return prisma.consultation.findFirst({ where: { id, tenantId } });
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
  if (!client) throw new Error("العميل غير موجود");
  return client.name;
}

export async function createConsultation(
  tenantId: string,
  userId: string,
  input: CreateConsultationInput,
) {
  const clientName = await resolveClientName(tenantId, input.clientId);

  return prisma.$transaction(async (tx) => {
    const agg = await tx.consultation.aggregate({
      where: { tenantId },
      _max: { number: true },
    });
    const number = (agg._max.number ?? 0) + 1;

    const created = await tx.consultation.create({
      data: {
        tenantId,
        number,
        title: input.title,
        type: input.type ?? "LEGAL_CONSULTATION",
        clientId: input.clientId ?? null,
        clientName,
        assignedTo: (input.assignedTo ?? undefined) as Prisma.InputJsonValue,
        date: input.date,
        dateHijri: input.dateHijri ?? null,
        description: input.description ?? null,
        status: input.status ?? "ACTIVE",
        attachments: (input.attachments ?? undefined) as Prisma.InputJsonValue,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "consultation",
        entityId: created.id,
        details: JSON.stringify({
          number: created.number,
          title: created.title,
        }),
      },
    });

    return created;
  });
}

export async function updateConsultation(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateConsultationInput,
) {
  const existing = await prisma.consultation.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  const clientName =
    input.clientId !== undefined
      ? await resolveClientName(tenantId, input.clientId)
      : undefined;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.consultation.update({
      where: { id },
      data: {
        title: input.title,
        type: input.type,
        clientId: input.clientId,
        clientName,
        assignedTo:
          input.assignedTo === undefined
            ? undefined
            : (input.assignedTo as Prisma.InputJsonValue),
        date: input.date,
        dateHijri: input.dateHijri,
        description: input.description,
        status: input.status,
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
        entity: "consultation",
        entityId: id,
      },
    });

    return updated;
  });
}

export async function deleteConsultation(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.consultation.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.consultation.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "consultation",
        entityId: id,
      },
    });
  });

  return { id };
}
