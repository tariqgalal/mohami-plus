import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getTenantDetail,
  getTenantUsageStats,
  getTenantUserStats,
  getTenantActivityLog,
  listTrialRenewals,
} from "@/services/admin-service";
import { PLANS, TENANT_STATUS } from "@/lib/constants";
import { TenantDetailTabs } from "./tenant-detail-tabs";

const statusColors: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenant = await getTenantDetail(id);
  if (!tenant) notFound();

  const [usage, users, activityLog, renewals] = await Promise.all([
    getTenantUsageStats(id),
    getTenantUserStats(id),
    getTenantActivityLog(id, 20),
    listTrialRenewals(id, 50),
  ]);

  // Serialize Decimal/BigInt fields for client component
  const serializedTenant = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    email: tenant.email,
    phone: tenant.phone,
    city: tenant.city,
    address: tenant.address,
    licenseNumber: tenant.licenseNumber,
    logo: tenant.logo,
    plan: tenant.plan,
    status: tenant.status,
    trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
    subscriptionStart: tenant.subscriptionStart?.toISOString() ?? null,
    subscriptionEnd: tenant.subscriptionEnd?.toISOString() ?? null,
    maxUsers: tenant.maxUsers,
    maxCases: tenant.maxCases,
    maxStorage: Number(tenant.maxStorage),
    monthlyPrice: Number(tenant.monthlyPrice),
    lastActivityAt: tenant.lastActivityAt?.toISOString() ?? null,
    createdAt: tenant.createdAt.toISOString(),
    counts: tenant._count,
    payments: tenant.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      providerRef: p.providerRef,
      plan: p.plan,
      period: p.period,
      createdAt: p.createdAt.toISOString(),
    })),
  };

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    activitiesCount: u._count.activities,
    createdCasesCount: u._count.createdCases,
    sessionsCount: u._count.sessions,
  }));

  const serializedActivities = activityLog.map((a) => ({
    id: a.id,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId,
    details: a.details,
    createdAt: a.createdAt.toISOString(),
    user: a.user ? { id: a.user.id, name: a.user.name, role: a.user.role } : null,
  }));

  const serializedUsage = {
    storageUsed: usage.storageUsed,
    activeUsersLast7Days: usage.activeUsersLast7Days,
    recentLogins: usage.recentLogins.map((l) => ({
      id: l.id,
      name: l.name,
      role: l.role,
      lastLoginAt: l.lastLoginAt?.toISOString() ?? null,
    })),
    dailyActivity: usage.dailyActivity,
    monthlyCases: usage.monthlyCases,
    lastActivity: usage.lastActivity
      ? {
          action: usage.lastActivity.action,
          entity: usage.lastActivity.entity,
          createdAt: usage.lastActivity.createdAt.toISOString(),
        }
      : null,
    avgDaily: usage.avgDaily,
    activityLevel: usage.activityLevel,
    totalRevenue: usage.totalRevenue,
    paymentsCount: usage.paymentsCount,
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/admin" className="hover:text-slate-900">
          لوحة المنصة
        </Link>
        <ChevronRight className="size-3.5 mx-1 rotate-180" />
        <Link href="/admin/tenants" className="hover:text-slate-900">
          المكاتب
        </Link>
        <ChevronRight className="size-3.5 mx-1 rotate-180" />
        <span className="text-slate-900 font-medium">{tenant.name}</span>
      </nav>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className="bg-slate-100 text-slate-700">
              {PLANS[tenant.plan]?.name ?? tenant.plan}
            </Badge>
            <Badge className={`${statusColors[tenant.status]} ring-1`}>
              {TENANT_STATUS[tenant.status]}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="size-7 text-amber-600" />
            {tenant.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-mono">{tenant.slug}</p>
        </div>
      </div>

      <TenantDetailTabs
        tenant={serializedTenant}
        users={serializedUsers}
        activities={serializedActivities}
        usage={serializedUsage}
        renewals={renewals.map((r) => ({
          id: r.id,
          type: r.type,
          days: r.days,
          reason: r.reason,
          previousEnd: r.previousEnd?.toISOString() ?? null,
          newEnd: r.newEnd.toISOString(),
          createdAt: r.createdAt.toISOString(),
          grantedBy: r.grantedBy
            ? { id: r.grantedBy.id, name: r.grantedBy.name }
            : null,
        }))}
      />
    </div>
  );
}
