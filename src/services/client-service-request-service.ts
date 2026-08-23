import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateServiceRequestInput,
  UpdateServiceRequestInput,
  ServiceRequestFiltersInput,
} from "@/lib/validations/client-service-request";

/** يربط معرّفات المكلَّفين بأسمائهم (ضمن نفس المكتب) لعرضها في القوائم */
async function attachAssignees<T extends { assignedTo: string | null }>(
  tenantId: string,
  rows: T[],
): Promise<(T & { assignedToName: string | null })[]> {
  const ids = [...new Set(rows.map((r) => r.assignedTo).filter(Boolean))] as string[];
  if (ids.length === 0) {
    return rows.map((r) => ({ ...r, assignedToName: null }));
  }
  const users = await prisma.user.findMany({
    where: { id: { in: ids }, tenantId },
    select: { id: true, name: true },
  });
  const map = new Map(users.map((u) => [u.id, u.name]));
  return rows.map((r) => ({
    ...r,
    assignedToName: r.assignedTo ? map.get(r.assignedTo) ?? null : null,
  }));
}

export async function listServiceRequests(
  tenantId: string,
  filters: ServiceRequestFiltersInput,
) {
  const where: Prisma.ClientServiceRequestWhereInput = { tenantId };

  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.q) {
    where.OR = [
      { applicantName: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { requestType: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ClientServiceRequestOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [rows, total] = await Promise.all([
    prisma.clientServiceRequest.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.clientServiceRequest.count({ where }),
  ]);

  const items = await attachAssignees(tenantId, rows);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

/** عدد الطلبات حسب كل حالة (للتابات) */
export async function countServiceRequestsByStatus(tenantId: string) {
  const rows = await prisma.clientServiceRequest.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

export async function getServiceRequest(tenantId: string, id: string) {
  const item = await prisma.clientServiceRequest.findFirst({
    where: { id, tenantId },
  });
  if (!item) return null;
  const [withName] = await attachAssignees(tenantId, [item]);
  return withName;
}

export async function createServiceRequest(
  tenantId: string,
  userId: string,
  input: CreateServiceRequestInput,
) {
  const assignedTo = input.assignedTo || null;

  // تحقق أن المكلَّف (إن وُجد) يخص نفس المكتب
  if (assignedTo) {
    const assignee = await prisma.user.findFirst({
      where: { id: assignedTo, tenantId },
      select: { id: true },
    });
    if (!assignee) throw new Error("الموظف المكلَّف غير موجود");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.clientServiceRequest.create({
      data: {
        tenantId,
        source: input.source,
        requestType: input.requestType,
        requestSubType: input.requestSubType ?? null,
        description: input.description,
        applicantName: input.applicantName,
        applicantPhone: input.applicantPhone ?? null,
        applicantEmail: input.applicantEmail ?? null,
        status: input.status ?? "NEW",
        assignedTo,
        dateHijri: input.dateHijri ?? null,
        ...(input.date ? { date: input.date } : {}),
        notes: input.notes ?? null,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "service_request",
        entityId: created.id,
        details: JSON.stringify({ applicantName: created.applicantName }),
      },
    });

    return created;
  });
}

export async function updateServiceRequest(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateServiceRequestInput,
) {
  const existing = await prisma.clientServiceRequest.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  if (input.assignedTo) {
    const assignee = await prisma.user.findFirst({
      where: { id: input.assignedTo, tenantId },
      select: { id: true },
    });
    if (!assignee) throw new Error("الموظف المكلَّف غير موجود");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.clientServiceRequest.update({
      where: { id },
      data: {
        source: input.source,
        requestType: input.requestType,
        requestSubType: input.requestSubType,
        description: input.description,
        applicantName: input.applicantName,
        applicantPhone: input.applicantPhone,
        applicantEmail: input.applicantEmail,
        status: input.status,
        assignedTo:
          input.assignedTo === undefined ? undefined : input.assignedTo || null,
        dateHijri: input.dateHijri,
        date: input.date,
        notes: input.notes,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "service_request",
        entityId: id,
      },
    });

    return updated;
  });
}

export async function deleteServiceRequest(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.clientServiceRequest.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.clientServiceRequest.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "service_request",
        entityId: id,
      },
    });
  });

  return { id };
}
