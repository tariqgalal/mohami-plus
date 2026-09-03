import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentFiltersInput,
} from "@/lib/validations/document";
import { AppError, NotFoundError } from "@/lib/errors";

export async function listDocuments(
  tenantId: string,
  filters: DocumentFiltersInput,
) {
  const where: Prisma.DocumentWhereInput = { tenantId };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.category) where.category = filters.category;
  if (filters.caseId) where.caseId = filters.caseId;

  const orderBy: Prisma.DocumentOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getDocument(tenantId: string, id: string) {
  return prisma.document.findFirst({
    where: { id, tenantId },
    include: {
      case: { select: { id: true, caseNumber: true, title: true } },
    },
  });
}

export async function createDocument(
  tenantId: string,
  userId: string,
  input: CreateDocumentInput,
) {
  const { assertCanAddStorage } = await import("@/lib/plan-limits");
  await assertCanAddStorage(tenantId, input.fileSize);

  if (input.caseId) {
    const c = await prisma.case.findFirst({
      where: { id: input.caseId, tenantId },
      select: { id: true },
    });
    if (!c) throw new NotFoundError("القضية غير موجودة");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.document.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description ?? null,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        fileSize: input.fileSize,
        category: input.category,
        caseId: input.caseId || null,
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "uploaded",
        entity: "document",
        entityId: created.id,
        caseId: input.caseId || null,
        details: JSON.stringify({ name: created.name }),
      },
    });
    return created;
  });
}

export async function updateDocument(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateDocumentInput,
) {
  const existing = await prisma.document.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.document.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        caseId: input.caseId === "" ? null : input.caseId,
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "document",
        entityId: id,
      },
    });
    return updated;
  });
}

export async function deleteDocument(
  _tenantId: string,
  _userId: string,
  _id: string,
) {
  throw new AppError("الحذف النهائي للمستندات غير مدعوم");
}
