import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateEmployeeLeaveInput,
  UpdateEmployeeLeaveInput,
  EmployeeLeaveFiltersInput,
} from "@/lib/validations/employee-leave";

/** عدد الأيام شاملاً يومي البداية والنهاية */
function daysBetween(start: Date, end: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((b - a) / MS_PER_DAY) + 1;
}

function buildWhere(
  tenantId: string,
  filters: EmployeeLeaveFiltersInput,
): Prisma.EmployeeLeaveWhereInput {
  const where: Prisma.EmployeeLeaveWhereInput = { tenantId };
  if (filters.employeeId) where.employeeId = filters.employeeId;
  if (filters.leaveType) where.leaveType = filters.leaveType;
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.startDate = {};
    if (filters.from) where.startDate.gte = filters.from;
    if (filters.to) where.startDate.lte = filters.to;
  }
  if (filters.q) {
    where.employeeName = { contains: filters.q, mode: "insensitive" };
  }
  return where;
}

export async function listEmployeeLeaves(
  tenantId: string,
  filters: EmployeeLeaveFiltersInput,
) {
  const where = buildWhere(tenantId, filters);
  const orderBy: Prisma.EmployeeLeaveOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total, totalDaysAgg] = await Promise.all([
    prisma.employeeLeave.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.employeeLeave.count({ where }),
    prisma.employeeLeave.aggregate({ where, _sum: { daysCount: true } }),
  ]);

  return {
    items,
    total,
    totalDays: totalDaysAgg._sum.daysCount ?? 0,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getEmployeeLeave(tenantId: string, id: string) {
  return prisma.employeeLeave.findFirst({ where: { id, tenantId } });
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

export async function createEmployeeLeave(
  tenantId: string,
  userId: string,
  input: CreateEmployeeLeaveInput,
) {
  const employeeName = await resolveEmployeeName(tenantId, input.employeeId);
  const daysCount = daysBetween(input.startDate, input.endDate);

  return prisma.$transaction(async (tx) => {
    const created = await tx.employeeLeave.create({
      data: {
        tenantId,
        employeeId: input.employeeId,
        employeeName,
        leaveType: input.leaveType,
        startDate: input.startDate,
        startDateHijri: input.startDateHijri,
        endDate: input.endDate,
        endDateHijri: input.endDateHijri,
        daysCount,
        status: input.status ?? "PENDING",
        notes: input.notes ?? null,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "employee_leave",
        entityId: created.id,
        details: JSON.stringify({ employeeName, daysCount }),
      },
    });

    return created;
  });
}

export async function updateEmployeeLeave(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateEmployeeLeaveInput,
) {
  const existing = await prisma.employeeLeave.findFirst({
    where: { id, tenantId },
  });
  if (!existing) return null;

  const employeeName = input.employeeId
    ? await resolveEmployeeName(tenantId, input.employeeId)
    : undefined;

  const startDate = input.startDate ?? existing.startDate;
  const endDate = input.endDate ?? existing.endDate;
  const daysCount =
    input.startDate || input.endDate
      ? daysBetween(startDate, endDate)
      : undefined;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.employeeLeave.update({
      where: { id },
      data: {
        employeeId: input.employeeId,
        employeeName,
        leaveType: input.leaveType,
        startDate: input.startDate,
        startDateHijri: input.startDateHijri,
        endDate: input.endDate,
        endDateHijri: input.endDateHijri,
        daysCount,
        status: input.status,
        notes: input.notes,
      },
    });

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "employee_leave",
        entityId: id,
      },
    });

    return updated;
  });
}

export async function deleteEmployeeLeave(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.employeeLeave.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.employeeLeave.delete({ where: { id } });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "deleted",
        entity: "employee_leave",
        entityId: id,
      },
    });
  });

  return { id };
}
