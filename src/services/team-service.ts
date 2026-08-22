import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  TeamFiltersInput,
} from "@/lib/validations/team";

export async function listTeam(tenantId: string, filters: TeamFiltersInput) {
  const where: Prisma.UserWhereInput = { tenantId };
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.role) where.role = filters.role;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        specialization: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { assignedCases: true, sessions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getTeamMember(tenantId: string, id: string) {
  return prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      specialization: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      assignedCases: {
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              status: true,
              priority: true,
              client: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
      sessions: {
        take: 20,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          time: true,
          court: true,
          status: true,
          case: { select: { id: true, caseNumber: true, title: true } },
        },
      },
      _count: { select: { assignedCases: true, sessions: true } },
    },
  });
}

export async function createTeamMember(
  tenantId: string,
  currentUserId: string,
  input: CreateTeamMemberInput,
  tenantMaxUsers: number,
) {
  const currentCount = await prisma.user.count({ where: { tenantId } });
  if (currentCount >= tenantMaxUsers) {
    throw new Error(
      `وصلت للحد الأقصى من المستخدمين في باقتك (${tenantMaxUsers}). رقّ الباقة لإضافة المزيد.`,
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new Error("هذا البريد الإلكتروني مسجل مسبقاً");
  }

  const hashed = await bcrypt.hash(input.password, 10);
  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        tenantId,
        name: input.name,
        email: input.email,
        password: hashed,
        phone: input.phone ?? null,
        role: input.role,
        specialization: input.specialization ?? null,
        isActive: input.isActive ?? true,
        avatar: input.avatar || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId: currentUserId,
        action: "created",
        entity: "user",
        entityId: created.id,
        details: JSON.stringify({ email: created.email }),
      },
    });
    return created;
  });
}

export async function updateTeamMember(
  tenantId: string,
  currentUserId: string,
  id: string,
  input: UpdateTeamMemberInput,
) {
  const existing = await prisma.user.findFirst({
    where: { id, tenantId },
    select: { id: true, role: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        name: input.name,
        phone: input.phone,
        role: input.role,
        specialization: input.specialization,
        isActive: input.isActive,
        avatar: input.avatar !== undefined ? input.avatar || null : undefined,
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId: currentUserId,
        action: "updated",
        entity: "user",
        entityId: id,
      },
    });
    return updated;
  });
}

export async function resetTeamMemberPassword(
  tenantId: string,
  currentUserId: string,
  id: string,
  password: string,
) {
  const existing = await prisma.user.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  const hashed = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { password: hashed },
    }),
    prisma.activity.create({
      data: {
        tenantId,
        userId: currentUserId,
        action: "reset_password",
        entity: "user",
        entityId: id,
      },
    }),
  ]);
  return { id };
}

export async function deleteTeamMember(
  tenantId: string,
  currentUserId: string,
  id: string,
) {
  if (id === currentUserId) {
    throw new Error("لا يمكنك حذف حسابك الخاص");
  }
  const existing = await prisma.user.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { assignedCases: true } } },
  });
  if (!existing) return null;
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { isActive: false } }),
    prisma.activity.create({
      data: {
        tenantId,
        userId: currentUserId,
        action: "deactivated",
        entity: "user",
        entityId: id,
      },
    }),
  ]);
  return existing;
}
