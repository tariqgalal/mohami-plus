import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateJudgmentInput,
  UpdateJudgmentInput,
  JudgmentFiltersInput,
} from "@/lib/validations/judgment";
import { NotFoundError } from "@/lib/errors";

export async function listJudgments(
  tenantId: string,
  filters: JudgmentFiltersInput,
) {
  const where: Prisma.CourtJudgmentWhereInput = { tenantId };

  if (filters.objectionStatus) where.objectionStatus = filters.objectionStatus;
  if (filters.judgmentLevel) where.judgmentLevel = filters.judgmentLevel;
  if (filters.caseId) where.caseId = filters.caseId;
  if (filters.q) {
    where.OR = [
      { caseNumber: { contains: filters.q, mode: "insensitive" } },
      { caseTitle: { contains: filters.q, mode: "insensitive" } },
      { judgmentSummary: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.CourtJudgmentOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.courtJudgment.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.courtJudgment.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

/** عدد الأحكام حسب حالة الاعتراض (للتابات) */
export async function countJudgmentsByObjection(tenantId: string) {
  const rows = await prisma.courtJudgment.groupBy({
    by: ["objectionStatus"],
    where: { tenantId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.objectionStatus] = r._count._all;
  return counts;
}

export async function getJudgment(tenantId: string, id: string) {
  return prisma.courtJudgment.findFirst({ where: { id, tenantId } });
}

async function resolveCase(tenantId: string, caseId: string) {
  const c = await prisma.case.findFirst({
    where: { id: caseId, tenantId },
    select: { caseNumber: true, title: true },
  });
  if (!c) throw new NotFoundError("القضية غير موجودة");
  return c;
}

export async function createJudgment(
  tenantId: string,
  userId: string,
  input: CreateJudgmentInput,
) {
  const c = await resolveCase(tenantId, input.caseId);

  return prisma.$transaction(async (tx) => {
    const created = await tx.courtJudgment.create({
      data: {
        tenantId,
        caseId: input.caseId,
        caseNumber: c.caseNumber,
        caseTitle: c.title,
        judgmentLevel: input.judgmentLevel ?? "FIRST_INSTANCE",
        judgmentResult: input.judgmentResult ?? "PARTIAL",
        judgmentSummary: input.judgmentSummary ?? null,
        receiveDate: input.receiveDate ?? null,
        receiveDateHijri: input.receiveDateHijri ?? null,
        objectionStatus: input.objectionStatus ?? "PENDING",
        objectionDeadline: input.objectionDeadline ?? null,
        notes: input.notes ?? null,
        attachments: (input.attachments ?? undefined) as Prisma.InputJsonValue,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "judgment",
        entityId: created.id,
        caseId: created.caseId,
        details: JSON.stringify({
          caseNumber: created.caseNumber,
          judgmentResult: created.judgmentResult,
        }),
      },
    });

    return created;
  });
}

export async function updateJudgment(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateJudgmentInput,
) {
  const existing = await prisma.courtJudgment.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  const c = input.caseId ? await resolveCase(tenantId, input.caseId) : null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.courtJudgment.update({
      where: { id },
      data: {
        caseId: input.caseId,
        caseNumber: c?.caseNumber,
        caseTitle: c?.title,
        judgmentLevel: input.judgmentLevel,
        judgmentResult: input.judgmentResult,
        judgmentSummary: input.judgmentSummary,
        receiveDate: input.receiveDate,
        receiveDateHijri: input.receiveDateHijri,
        objectionStatus: input.objectionStatus,
        objectionDeadline: input.objectionDeadline,
        notes: input.notes,
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
        entity: "judgment",
        entityId: id,
        caseId: updated.caseId,
      },
    });

    return updated;
  });
}

export async function deleteJudgment(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.courtJudgment.findFirst({
    where: { id, tenantId },
    select: { id: true, caseId: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.courtJudgment.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "judgment",
        entityId: id,
        caseId: existing.caseId,
      },
    });
  });

  return { id };
}
