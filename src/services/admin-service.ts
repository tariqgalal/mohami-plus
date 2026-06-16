import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanKey } from "@/lib/constants";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TenantFiltersInput {
  q?: string;
  status?: string;
  plan?: string;
  city?: string;
  activity?: "active" | "idle" | "inactive";
  sort?: "recent" | "name" | "users" | "revenue" | "expiring";
  page: number;
  limit: number;
}

export async function listTenants(filters: TenantFiltersInput) {
  const conditions: Prisma.TenantWhereInput[] = [];

  if (filters.q) {
    conditions.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { email: { contains: filters.q, mode: "insensitive" } },
        { phone: { contains: filters.q } },
        { slug: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.status) conditions.push({ status: filters.status as never });
  if (filters.plan) conditions.push({ plan: filters.plan as never });
  if (filters.city) conditions.push({ city: filters.city });

  if (filters.activity) {
    const now = Date.now();
    const sevenAgo = new Date(now - 7 * DAY_MS);
    const thirtyAgo = new Date(now - 30 * DAY_MS);
    if (filters.activity === "active") {
      conditions.push({ lastActivityAt: { gte: sevenAgo } });
    } else if (filters.activity === "idle") {
      conditions.push({
        lastActivityAt: { lt: sevenAgo, gte: thirtyAgo },
      });
    } else if (filters.activity === "inactive") {
      conditions.push({
        OR: [
          { lastActivityAt: { lt: thirtyAgo } },
          { lastActivityAt: null },
        ],
      });
    }
  }

  const where: Prisma.TenantWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const orderBy: Prisma.TenantOrderByWithRelationInput = (() => {
    switch (filters.sort) {
      case "name":
        return { name: "asc" };
      case "users":
        return { users: { _count: "desc" } };
      case "revenue":
        return { monthlyPrice: "desc" };
      case "expiring":
        return { subscriptionEnd: "asc" };
      case "recent":
      default:
        return { createdAt: "desc" };
    }
  })();

  const [items, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        _count: {
          select: { users: true, cases: true, clients: true, documents: true },
        },
        users: {
          where: { role: "FIRM_ADMIN" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            lastLoginAt: true,
          },
          take: 1,
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  // اجمع حجم التخزين لكل مكتب في القائمة
  const tenantIds = items.map((t) => t.id);
  const storageUsage =
    tenantIds.length > 0
      ? await prisma.document.groupBy({
          by: ["tenantId"],
          where: { tenantId: { in: tenantIds } },
          _sum: { fileSize: true },
        })
      : [];
  const storageMap = new Map(
    storageUsage.map((s) => [s.tenantId, Number(s._sum.fileSize ?? 0)]),
  );

  const enriched = items.map((t) => ({
    ...t,
    owner: t.users[0] ?? null,
    storageUsed: storageMap.get(t.id) ?? 0,
  }));

  return {
    items: enriched,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getTenantDetail(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          cases: true,
          clients: true,
          sessions: true,
          invoices: true,
          documents: true,
          meetings: true,
        },
      },
      users: {
        where: { isSuperAdmin: false },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function getTenantUsageStats(tenantId: string) {
  const sevenAgo = new Date(Date.now() - 7 * DAY_MS);
  const thirtyAgo = new Date(Date.now() - 30 * DAY_MS);

  const [storage, activeUsersCount, recentLogins, activitiesByDay, casesByMonth, lastActivity, totalRevenue] =
    await Promise.all([
      prisma.document.aggregate({
        where: { tenantId },
        _sum: { fileSize: true },
      }),
      prisma.user.count({
        where: { tenantId, lastLoginAt: { gte: sevenAgo } },
      }),
      prisma.user.findMany({
        where: { tenantId, lastLoginAt: { not: null } },
        select: { id: true, name: true, lastLoginAt: true, role: true },
        orderBy: { lastLoginAt: "desc" },
        take: 10,
      }),
      prisma.activity.findMany({
        where: { tenantId, createdAt: { gte: thirtyAgo } },
        select: { createdAt: true, action: true },
      }),
      prisma.case.findMany({
        where: { tenantId, createdAt: { gte: new Date(Date.now() - 365 * DAY_MS) } },
        select: { createdAt: true },
      }),
      prisma.activity.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, action: true, entity: true },
      }),
      prisma.payment.aggregate({
        where: { tenantId, status: "paid" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

  // Daily activity for last 30 days
  const dailyActivity: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    dailyActivity.push({ date: key, count: 0 });
  }
  const dailyMap = new Map(dailyActivity.map((d) => [d.date, d]));
  for (const a of activitiesByDay) {
    const key = a.createdAt.toISOString().slice(0, 10);
    const bucket = dailyMap.get(key);
    if (bucket) bucket.count++;
  }

  // Monthly cases for last 12 months
  const monthlyCases: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyCases.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      count: 0,
    });
  }
  const monthlyMap = new Map(monthlyCases.map((m) => [m.month, m]));
  for (const c of casesByMonth) {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyMap.get(key);
    if (bucket) bucket.count++;
  }

  const avgDaily =
    dailyActivity.reduce((s, d) => s + d.count, 0) / dailyActivity.length;

  // مؤشر النشاط
  let activityLevel: "very_active" | "active" | "idle" | "inactive" = "inactive";
  if (avgDaily >= 20) activityLevel = "very_active";
  else if (avgDaily >= 5) activityLevel = "active";
  else if (avgDaily >= 1) activityLevel = "idle";

  return {
    storageUsed: Number(storage._sum.fileSize ?? 0),
    activeUsersLast7Days: activeUsersCount,
    recentLogins,
    dailyActivity,
    monthlyCases,
    lastActivity,
    avgDaily,
    activityLevel,
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    paymentsCount: totalRevenue._count,
  };
}

export async function getTenantActivityLog(tenantId: string, limit = 20) {
  return prisma.activity.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });
}

export async function getTenantUserStats(tenantId: string) {
  const users = await prisma.user.findMany({
    where: { tenantId, isSuperAdmin: false },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: { activities: true, createdCases: true, sessions: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return users;
}

export async function updateTenantStatus(
  id: string,
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED" | "TRIAL",
) {
  return prisma.tenant.update({
    where: { id },
    data: { status },
  });
}

export async function extendTrial(
  id: string,
  days: number,
  grantedById: string,
  reason?: string,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { trialEndsAt: true },
  });
  if (!tenant) return null;
  const base =
    tenant.trialEndsAt && tenant.trialEndsAt > new Date()
      ? tenant.trialEndsAt
      : new Date();
  const newEnd = new Date(base.getTime() + days * DAY_MS);

  const [updated] = await prisma.$transaction([
    prisma.tenant.update({
      where: { id },
      data: { trialEndsAt: newEnd, status: "TRIAL" },
    }),
    prisma.trialRenewal.create({
      data: {
        tenantId: id,
        grantedById,
        type: "EXTEND_TRIAL",
        days,
        reason: reason ?? null,
        previousEnd: tenant.trialEndsAt,
        newEnd,
      },
    }),
  ]);
  return updated;
}

export async function grantFreeMonths(
  id: string,
  months: number,
  grantedById: string,
  reason?: string,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { subscriptionEnd: true, subscriptionStart: true },
  });
  if (!tenant) return null;
  const now = new Date();
  const base =
    tenant.subscriptionEnd && tenant.subscriptionEnd > now
      ? tenant.subscriptionEnd
      : now;
  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + months);

  const [updated] = await prisma.$transaction([
    prisma.tenant.update({
      where: { id },
      data: {
        subscriptionEnd: newEnd,
        subscriptionStart: tenant.subscriptionStart ?? now,
        status: "ACTIVE",
      },
    }),
    prisma.trialRenewal.create({
      data: {
        tenantId: id,
        grantedById,
        type: "GRANT_FREE_MONTHS",
        days: months * 30,
        reason: reason ?? null,
        previousEnd: tenant.subscriptionEnd,
        newEnd,
      },
    }),
  ]);
  return updated;
}

export async function convertTrialToPaid(
  id: string,
  plan: PlanKey,
  grantedById: string,
  reason?: string,
) {
  const p = PLANS[plan];
  const now = new Date();
  const newEnd = new Date(now);
  newEnd.setMonth(newEnd.getMonth() + 1);

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { trialEndsAt: true, subscriptionEnd: true },
  });
  if (!tenant) return null;

  const [updated] = await prisma.$transaction([
    prisma.tenant.update({
      where: { id },
      data: {
        plan,
        status: "ACTIVE",
        subscriptionStart: now,
        subscriptionEnd: newEnd,
        maxUsers: p.maxUsers,
        maxCases: p.maxCases,
        maxStorage: BigInt(p.maxStorage),
        monthlyPrice: p.price,
      },
    }),
    prisma.trialRenewal.create({
      data: {
        tenantId: id,
        grantedById,
        type: "CONVERT_TO_PAID",
        days: 30,
        reason: reason ?? null,
        previousEnd: tenant.trialEndsAt ?? tenant.subscriptionEnd,
        newEnd,
      },
    }),
  ]);
  return updated;
}

export async function listTrialRenewals(tenantId: string, limit = 50) {
  return prisma.trialRenewal.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      grantedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function changeTenantPlan(id: string, plan: PlanKey) {
  const p = PLANS[plan];
  return prisma.tenant.update({
    where: { id },
    data: {
      plan,
      maxUsers: p.maxUsers,
      maxCases: p.maxCases,
      maxStorage: BigInt(p.maxStorage),
      monthlyPrice: p.price,
    },
  });
}

export async function updateTenantLimits(
  id: string,
  limits: { maxUsers?: number; maxCases?: number; maxStorageGB?: number },
) {
  const data: Prisma.TenantUpdateInput = {};
  if (limits.maxUsers !== undefined) data.maxUsers = limits.maxUsers;
  if (limits.maxCases !== undefined) data.maxCases = limits.maxCases;
  if (limits.maxStorageGB !== undefined) {
    data.maxStorage = BigInt(limits.maxStorageGB * 1024 * 1024 * 1024);
  }
  return prisma.tenant.update({ where: { id }, data });
}

export async function resetTenantOwnerPassword(
  tenantId: string,
  newPasswordHash: string,
) {
  const owner = await prisma.user.findFirst({
    where: { tenantId, role: "FIRM_ADMIN" },
  });
  if (!owner) return null;
  return prisma.user.update({
    where: { id: owner.id },
    data: { password: newPasswordHash },
  });
}

export async function softDeleteTenant(id: string) {
  // نتعامل مع الحذف كإلغاء وتعطيل كل المستخدمين
  await prisma.user.updateMany({
    where: { tenantId: id },
    data: { isActive: false },
  });
  return prisma.tenant.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

// ============================
//      Platform-wide stats
// ============================

export async function getPlatformStats() {
  const now = new Date();
  const sevenAgo = new Date(now.getTime() - 7 * DAY_MS);
  const threeAhead = new Date(now.getTime() + 3 * DAY_MS);
  const thirtyAhead = new Date(now.getTime() + 30 * DAY_MS);

  const [
    totals,
    byStatus,
    byPlan,
    recentTenants,
    monthlyRevenue,
    totalRevenue,
    activeUsers,
    totalCases,
    inactiveTenants,
    expiringSubs,
    monthlyGrowth,
    expiredTrialsCount,
    trialsExpiringSoonCount,
  ] = await Promise.all([
    prisma.tenant.aggregate({
      _count: true,
      _sum: { monthlyPrice: true },
    }),
    prisma.tenant.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.tenant.groupBy({
      by: ["plan"],
      _count: true,
      _sum: { monthlyPrice: true },
    }),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        plan: true,
        status: true,
        createdAt: true,
        _count: { select: { users: true, cases: true } },
      },
    }),
    getMonthlyRevenue(6),
    prisma.payment.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
    prisma.user.count({
      where: { isSuperAdmin: false, lastLoginAt: { gte: sevenAgo } },
    }),
    prisma.case.count(),
    prisma.tenant.findMany({
      where: {
        status: { in: ["ACTIVE", "TRIAL"] },
        OR: [
          { lastActivityAt: { lt: sevenAgo } },
          { lastActivityAt: null, createdAt: { lt: sevenAgo } },
        ],
      },
      orderBy: { lastActivityAt: "asc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        lastActivityAt: true,
        createdAt: true,
      },
    }),
    prisma.tenant.findMany({
      where: {
        OR: [
          {
            status: "ACTIVE",
            subscriptionEnd: { gte: new Date(), lte: thirtyAhead },
          },
          {
            status: "TRIAL",
            trialEndsAt: { gte: new Date(), lte: thirtyAhead },
          },
        ],
      },
      orderBy: [{ subscriptionEnd: "asc" }, { trialEndsAt: "asc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        monthlyPrice: true,
        trialEndsAt: true,
        subscriptionEnd: true,
      },
    }),
    getMonthlyTenantGrowth(12),
    prisma.tenant.count({
      where: { status: "TRIAL", trialEndsAt: { lt: now } },
    }),
    prisma.tenant.count({
      where: {
        status: "TRIAL",
        trialEndsAt: { gte: now, lte: threeAhead },
      },
    }),
  ]);

  const userCount = await prisma.user.count({
    where: { isSuperAdmin: false },
  });

  return {
    totalTenants: totals._count,
    activeTenants:
      byStatus.find((s) => s.status === "ACTIVE")?._count ?? 0,
    trialTenants:
      byStatus.find((s) => s.status === "TRIAL")?._count ?? 0,
    suspendedTenants:
      byStatus.find((s) => s.status === "SUSPENDED")?._count ?? 0,
    expiredTenants:
      byStatus.find((s) => s.status === "EXPIRED")?._count ?? 0,
    cancelledTenants:
      byStatus.find((s) => s.status === "CANCELLED")?._count ?? 0,
    monthlyRecurringRevenue: Number(totals._sum.monthlyPrice ?? 0),
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    totalUsers: userCount,
    activeUsers,
    totalCases,
    byStatus,
    byPlan,
    recentTenants,
    monthlyRevenue,
    monthlyGrowth,
    inactiveTenants,
    expiringSubs,
    expiredTrialsCount,
    trialsExpiringSoonCount,
  };
}

async function getMonthlyRevenue(months: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const payments = await prisma.payment.findMany({
    where: {
      status: "paid",
      createdAt: { gte: start },
    },
    select: { createdAt: true, amount: true },
  });

  const buckets: Record<string, { month: string; amount: number }> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets[key] = { month: key, amount: 0 };
  }

  for (const p of payments) {
    const d = p.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets[key]) {
      buckets[key].amount += Number(p.amount);
    }
  }

  return Object.values(buckets);
}

async function getMonthlyTenantGrowth(months: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const tenants = await prisma.tenant.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const buckets: Record<string, { month: string; count: number }> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets[key] = { month: key, count: 0 };
  }

  for (const t of tenants) {
    const d = t.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets[key]) buckets[key].count++;
  }

  return Object.values(buckets);
}

export async function getRevenueBreakdown() {
  const [byPlan, topTenants] = await Promise.all([
    prisma.payment.groupBy({
      by: ["plan"],
      where: { status: "paid" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ["tenantId"],
      where: { status: "paid" },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    }),
  ]);

  const tenantIds = topTenants.map((t) => t.tenantId);
  const tenants =
    tenantIds.length > 0
      ? await prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true, plan: true, email: true },
        })
      : [];
  const tenantMap = Object.fromEntries(tenants.map((t) => [t.id, t]));

  return {
    byPlan: byPlan.map((p) => ({
      plan: p.plan,
      amount: Number(p._sum.amount ?? 0),
      count: p._count,
    })),
    topTenants: topTenants.map((t) => ({
      tenant: tenantMap[t.tenantId],
      amount: Number(t._sum.amount ?? 0),
      count: t._count,
    })),
  };
}

export async function getMonthlyRevenueRange(months: number) {
  return getMonthlyRevenue(months);
}

export async function getAverageRevenuePerTenant() {
  const [activeCount, revenue] = await Promise.all([
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
  ]);
  const total = Number(revenue._sum.amount ?? 0);
  return activeCount > 0 ? total / activeCount : 0;
}

export async function listAllPayments(filters: {
  page: number;
  limit: number;
  status?: string;
}) {
  const where: Prisma.PaymentWhereInput = {};
  if (filters.status) where.status = filters.status;

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        tenant: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

// ============================
//      All subscriptions
// ============================

export async function listAllSubscriptions(filters?: {
  filter?:
    | "all"
    | "active"
    | "trial"
    | "expiring"
    | "expiring_3"
    | "expired"
    | "expired_trial"
    | "suspended";
}) {
  const where: Prisma.TenantWhereInput = {};
  const now = new Date();
  const in3 = new Date(now.getTime() + 3 * DAY_MS);
  const in30 = new Date(now.getTime() + 30 * DAY_MS);

  switch (filters?.filter) {
    case "active":
      where.status = "ACTIVE";
      break;
    case "trial":
      where.status = "TRIAL";
      break;
    case "expiring":
      where.OR = [
        {
          status: "ACTIVE",
          subscriptionEnd: { gte: now, lte: in30 },
        },
        {
          status: "TRIAL",
          trialEndsAt: { gte: now, lte: in30 },
        },
      ];
      break;
    case "expiring_3":
      where.status = "TRIAL";
      where.trialEndsAt = { gte: now, lte: in3 };
      break;
    case "expired":
      where.status = "EXPIRED";
      break;
    case "expired_trial":
      where.status = "TRIAL";
      where.trialEndsAt = { lt: now };
      break;
    case "suspended":
      where.status = "SUSPENDED";
      break;
  }

  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: [{ status: "asc" }, { subscriptionEnd: "asc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      plan: true,
      status: true,
      monthlyPrice: true,
      trialEndsAt: true,
      subscriptionEnd: true,
      subscriptionStart: true,
      createdAt: true,
    },
  });

  return tenants;
}

// ============================
//      Platform settings
// ============================

export async function getPlatformSettings() {
  const items = await prisma.platformSetting.findMany();
  const map: Record<string, string> = {};
  for (const i of items) map[i.key] = i.value;
  return map;
}

export async function updatePlatformSetting(key: string, value: string) {
  return prisma.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function updatePlatformSettings(
  values: Record<string, string>,
) {
  const entries = Object.entries(values);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );
  return getPlatformSettings();
}
