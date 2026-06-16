import { prisma } from "@/lib/prisma";

export class PlanLimitError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export async function assertCanAddCase(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { maxCases: true, _count: { select: { cases: true } } },
  });
  if (!tenant) throw new PlanLimitError("المكتب غير موجود");
  if (tenant._count.cases >= tenant.maxCases) {
    throw new PlanLimitError(
      `وصلت للحد الأقصى للقضايا (${tenant.maxCases}). يرجى ترقية الباقة.`,
    );
  }
}

export async function assertCanAddUser(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { maxUsers: true, _count: { select: { users: true } } },
  });
  if (!tenant) throw new PlanLimitError("المكتب غير موجود");
  if (tenant._count.users >= tenant.maxUsers) {
    throw new PlanLimitError(
      `وصلت للحد الأقصى للمستخدمين (${tenant.maxUsers}). يرجى ترقية الباقة.`,
    );
  }
}

export async function assertCanAddStorage(
  tenantId: string,
  additionalBytes: number,
) {
  const [tenant, storage] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxStorage: true },
    }),
    prisma.document.aggregate({
      where: { tenantId },
      _sum: { fileSize: true },
    }),
  ]);
  if (!tenant) throw new PlanLimitError("المكتب غير موجود");
  const used = Number(storage._sum.fileSize ?? 0);
  const max = Number(tenant.maxStorage);
  if (used + additionalBytes > max) {
    const usedGB = (used / (1024 * 1024 * 1024)).toFixed(2);
    const maxGB = (max / (1024 * 1024 * 1024)).toFixed(0);
    throw new PlanLimitError(
      `وصلت للحد الأقصى للتخزين (${usedGB} / ${maxGB} GB). يرجى ترقية الباقة.`,
    );
  }
}

export async function touchTenantActivity(tenantId: string) {
  // أداة سريعة لتحديث آخر نشاط، يمكن استدعاؤها بشكل fire-and-forget
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { lastActivityAt: new Date() },
  }).catch(() => {});
}
