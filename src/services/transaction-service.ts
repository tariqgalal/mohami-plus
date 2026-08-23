import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFiltersInput,
} from "@/lib/validations/transaction";

export async function listTransactions(
  tenantId: string,
  filters: TransactionFiltersInput,
) {
  const where: Prisma.TransactionWhereInput = { tenantId };

  if (filters.direction) where.direction = filters.direction;
  if (filters.status) where.status = filters.status;
  if (filters.q) {
    where.OR = [
      { registryNumber: { contains: filters.q, mode: "insensitive" } },
      { subject: { contains: filters.q, mode: "insensitive" } },
      { senderName: { contains: filters.q, mode: "insensitive" } },
      { recipientName: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.TransactionOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getTransaction(tenantId: string, id: string) {
  return prisma.transaction.findFirst({ where: { id, tenantId } });
}

export async function createTransaction(
  tenantId: string,
  userId: string,
  input: CreateTransactionInput,
) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        tenantId,
        registryNumber: input.registryNumber,
        subject: input.subject,
        direction: input.direction,
        receiveDate: input.receiveDate ?? null,
        receiveDateHijri: input.receiveDateHijri ?? null,
        sendDate: input.sendDate ?? null,
        sendDateHijri: input.sendDateHijri ?? null,
        senderName: input.senderName ?? null,
        recipientName: input.recipientName ?? null,
        department: input.department ?? null,
        notes: input.notes ?? null,
        status: input.status ?? "ACTIVE",
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "transaction",
        entityId: created.id,
        details: JSON.stringify({
          registryNumber: created.registryNumber,
          direction: created.direction,
        }),
      },
    });

    return created;
  });
}

export async function updateTransaction(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateTransactionInput,
) {
  const existing = await prisma.transaction.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id },
      data: {
        registryNumber: input.registryNumber,
        subject: input.subject,
        direction: input.direction,
        receiveDate: input.receiveDate,
        receiveDateHijri: input.receiveDateHijri,
        sendDate: input.sendDate,
        sendDateHijri: input.sendDateHijri,
        senderName: input.senderName,
        recipientName: input.recipientName,
        department: input.department,
        notes: input.notes,
        status: input.status,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "transaction",
        entityId: id,
      },
    });

    return updated;
  });
}

export async function deleteTransaction(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.transaction.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "transaction",
        entityId: id,
      },
    });
  });

  return { id };
}
