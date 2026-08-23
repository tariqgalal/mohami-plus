import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateBorrowingInput,
  UpdateBorrowingInput,
  BorrowingFiltersInput,
} from "@/lib/validations/borrowing";

export async function listBorrowings(
  tenantId: string,
  filters: BorrowingFiltersInput,
) {
  const where: Prisma.DocumentBorrowingWhereInput = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.employeeId) where.employeeId = filters.employeeId;
  if (filters.q) {
    where.OR = [
      { employeeName: { contains: filters.q, mode: "insensitive" } },
      { documentSource: { contains: filters.q, mode: "insensitive" } },
      { documentType: { contains: filters.q, mode: "insensitive" } },
      { documentName: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.DocumentBorrowingOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.documentBorrowing.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.documentBorrowing.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

/** عدد الاستعارات حسب كل حالة (للتابات) */
export async function countBorrowingsByStatus(tenantId: string) {
  const rows = await prisma.documentBorrowing.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

export async function getBorrowing(tenantId: string, id: string) {
  return prisma.documentBorrowing.findFirst({ where: { id, tenantId } });
}

async function resolveEmployeeName(
  tenantId: string,
  employeeId: string,
): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { id: employeeId, tenantId },
    select: { name: true },
  });
  if (!user) throw new Error("الموظف غير موجود");
  return user.name;
}

export async function createBorrowing(
  tenantId: string,
  userId: string,
  input: CreateBorrowingInput,
) {
  const employeeName = await resolveEmployeeName(tenantId, input.employeeId);

  return prisma.$transaction(async (tx) => {
    const created = await tx.documentBorrowing.create({
      data: {
        tenantId,
        employeeId: input.employeeId,
        employeeName,
        documentSource: input.documentSource,
        documentType: input.documentType,
        documentName: input.documentName,
        description: input.description ?? null,
        borrowDate: input.borrowDate,
        borrowDateHijri: input.borrowDateHijri ?? null,
        returnDate: input.returnDate ?? null,
        returnDateHijri: input.returnDateHijri ?? null,
        status: input.status ?? "PENDING",
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "borrowing",
        entityId: created.id,
        details: JSON.stringify({
          employeeName,
          documentName: created.documentName,
        }),
      },
    });

    return created;
  });
}

export async function updateBorrowing(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateBorrowingInput,
) {
  const existing = await prisma.documentBorrowing.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  const employeeName = input.employeeId
    ? await resolveEmployeeName(tenantId, input.employeeId)
    : undefined;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.documentBorrowing.update({
      where: { id },
      data: {
        employeeId: input.employeeId,
        employeeName,
        documentSource: input.documentSource,
        documentType: input.documentType,
        documentName: input.documentName,
        description: input.description,
        borrowDate: input.borrowDate,
        borrowDateHijri: input.borrowDateHijri,
        returnDate: input.returnDate,
        returnDateHijri: input.returnDateHijri,
        status: input.status,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "borrowing",
        entityId: id,
      },
    });

    return updated;
  });
}

export async function deleteBorrowing(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.documentBorrowing.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.documentBorrowing.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "borrowing",
        entityId: id,
      },
    });
  });

  return { id };
}
