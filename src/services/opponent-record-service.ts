import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateOpponentInput,
  UpdateOpponentInput,
  OpponentFiltersInput,
} from "@/lib/validations/opponent-record";

function normalizeEmail(email?: string | null): string | null {
  return email && email.trim() !== "" ? email.trim() : null;
}

export async function listOpponents(
  tenantId: string,
  filters: OpponentFiltersInput,
) {
  const where: Prisma.OpponentRecordWhereInput = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { idNumber: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.OpponentRecordOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.opponentRecord.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.opponentRecord.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getOpponent(tenantId: string, id: string) {
  return prisma.opponentRecord.findFirst({ where: { id, tenantId } });
}

export async function createOpponent(
  tenantId: string,
  userId: string,
  input: CreateOpponentInput,
) {
  return prisma.$transaction(async (tx) => {
    // رقم تسلسلي تلقائي متسلسل لكل مكتب
    const agg = await tx.opponentRecord.aggregate({
      where: { tenantId },
      _max: { number: true },
    });
    const number = (agg._max.number ?? 0) + 1;

    const created = await tx.opponentRecord.create({
      data: {
        tenantId,
        number,
        name: input.name,
        idNumber: input.idNumber ?? null,
        phone: input.phone ?? null,
        email: normalizeEmail(input.email),
        address: input.address ?? null,
        notes: input.notes ?? null,
        caseIds: (input.caseIds ??
          []) as unknown as Prisma.InputJsonValue,
        status: input.status ?? "ACTIVE",
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "opponent",
        entityId: created.id,
        details: JSON.stringify({ number: created.number, name: created.name }),
      },
    });

    return created;
  });
}

export async function updateOpponent(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateOpponentInput,
) {
  const existing = await prisma.opponentRecord.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.opponentRecord.update({
      where: { id },
      data: {
        name: input.name,
        idNumber: input.idNumber,
        phone: input.phone,
        email:
          input.email !== undefined ? normalizeEmail(input.email) : undefined,
        address: input.address,
        notes: input.notes,
        caseIds:
          input.caseIds !== undefined
            ? ((input.caseIds ?? []) as unknown as Prisma.InputJsonValue)
            : undefined,
        status: input.status,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "opponent",
        entityId: id,
      },
    });

    return updated;
  });
}

export async function deleteOpponent(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.opponentRecord.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.opponentRecord.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "opponent",
        entityId: id,
      },
    });
  });

  return { id };
}
