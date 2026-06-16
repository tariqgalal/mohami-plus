import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Sparkles,
  UserCheck,
  Briefcase,
  Wallet,
  Clock,
  CalendarClock,
  Activity as ActivityIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlatformStats } from "@/services/admin-service";
import { PLANS, TENANT_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { CasesPieChart } from "@/components/charts/cases-pie-chart";
import { TenantGrowthChart } from "@/components/admin/tenant-growth-chart";

export const metadata: Metadata = {
  title: "لوحة المنصة",
};

const statusColors: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();

  const revenueChartData = stats.monthlyRevenue.map((m) => ({
    month: m.month,
    total: m.amount,
    paid: m.amount,
  }));

  const planPieData = stats.byPlan.map((p) => ({
    name: PLANS[p.plan as keyof typeof PLANS]?.name ?? p.plan,
    value: p._count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="size-7 text-amber-600" />
          لوحة تحكم المنصة
        </h1>
        <p className="text-slate-500 mt-1">
          نظرة شاملة على المكاتب والإيرادات والمستخدمين
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي المكاتب"
          value={String(stats.totalTenants)}
          icon={Building2}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="المكاتب النشطة"
          value={String(stats.activeTenants)}
          icon={Building2}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="المكاتب التجريبية"
          value={String(stats.trialTenants)}
          icon={Clock}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="المنتهية / المعلقة"
          value={String(stats.expiredTenants + stats.suspendedTenants)}
          icon={AlertCircle}
          color="bg-red-50 text-red-700"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي المستخدمين"
          value={String(stats.totalUsers)}
          icon={Users}
          color="bg-violet-50 text-violet-700"
        />
        <StatCard
          label="نشطون (آخر 7 أيام)"
          value={String(stats.activeUsers)}
          icon={UserCheck}
          color="bg-cyan-50 text-cyan-700"
        />
        <StatCard
          label="إجمالي القضايا"
          value={String(stats.totalCases)}
          icon={Briefcase}
          color="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          label="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={Wallet}
          color="bg-emerald-50 text-emerald-700"
        />
      </div>

      <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/40 border-amber-200">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-lg bg-amber-600 text-white grid place-items-center shrink-0">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="text-sm text-amber-900">الإيراد الشهري المتكرر (MRR)</p>
            <p className="text-2xl font-bold text-amber-900 tabular-nums">
              {formatCurrency(stats.monthlyRecurringRevenue)}
            </p>
          </div>
        </div>
      </Card>

      {(stats.expiredTrialsCount > 0 || stats.trialsExpiringSoonCount > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {stats.expiredTrialsCount > 0 && (
            <Card className="p-5 border-red-200 bg-red-50/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-11 rounded-lg bg-red-600 text-white grid place-items-center shrink-0">
                    <AlertCircle className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-red-900 font-medium">
                      مكاتب انتهت تجربتها ولم تشترك
                    </p>
                    <p className="text-2xl font-bold text-red-900 tabular-nums mt-1">
                      {stats.expiredTrialsCount} مكتب
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/subscriptions?filter=expired_trial"
                  className="shrink-0 px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  عرض القائمة
                </Link>
              </div>
            </Card>
          )}
          {stats.trialsExpiringSoonCount > 0 && (
            <Card className="p-5 border-amber-200 bg-amber-50/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-11 rounded-lg bg-amber-600 text-white grid place-items-center shrink-0">
                    <CalendarClock className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-amber-900 font-medium">
                      مكاتب تنتهي تجربتها خلال 3 أيام
                    </p>
                    <p className="text-2xl font-bold text-amber-900 tabular-nums mt-1">
                      {stats.trialsExpiringSoonCount} مكتب
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/subscriptions?filter=expiring_3"
                  className="shrink-0 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
                >
                  عرض القائمة
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              نمو المشتركين شهرياً (آخر 12 شهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyGrowth.every((m) => m.count === 0) ? (
              <p className="text-sm text-slate-500 text-center py-12">
                لا يوجد مشتركون مسجلون بعد
              </p>
            ) : (
              <TenantGrowthChart data={stats.monthlyGrowth} height={260} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="size-4 text-amber-600" />
              الإيرادات الشهرية (آخر 6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue.every((m) => m.amount === 0) ? (
              <p className="text-sm text-slate-500 text-center py-12">
                لا توجد مدفوعات مسجلة بعد
              </p>
            ) : (
              <MonthlyRevenueChart
                data={revenueChartData}
                variant="single"
                color="#d97706"
                totalLabel="الإيرادات"
                showLegend={false}
                height={260}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع الباقات</CardTitle>
          </CardHeader>
          <CardContent>
            {planPieData.length === 0 || planPieData.every((p) => p.value === 0) ? (
              <p className="text-sm text-slate-500 text-center py-12">
                لا توجد بيانات
              </p>
            ) : (
              <>
                <CasesPieChart data={planPieData} height={220} />
                <div className="mt-3 space-y-2">
                  {stats.byPlan.map((p) => (
                    <div
                      key={p.plan}
                      className="flex items-center justify-between text-sm pb-1 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-slate-700">
                        {PLANS[p.plan as keyof typeof PLANS]?.name ?? p.plan}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {p._count} مكتب
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {formatCurrency(Number(p._sum.monthlyPrice ?? 0))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byStatus.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                لا توجد بيانات
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {stats.byStatus.map((s) => (
                  <div
                    key={s.status}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center"
                  >
                    <Badge className={`${statusColors[s.status]} ring-1 mb-2`}>
                      {TENANT_STATUS[s.status as keyof typeof TENANT_STATUS]}
                    </Badge>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">
                      {s._count}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">آخر المكاتب المسجلة</CardTitle>
              <Link
                href="/admin/tenants"
                className="text-sm text-amber-700 hover:underline"
              >
                عرض الكل
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentTenants.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                لم يسجّل أي مكتب بعد
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recentTenants.map((t) => (
                  <Link
                    key={t.id}
                    href={`/admin/tenants/${t.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {t.city} · {t._count.users} مستخدمين · {t._count.cases} قضايا
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-slate-100 text-slate-700">
                        {PLANS[t.plan as keyof typeof PLANS]?.name ?? t.plan}
                      </Badge>
                      <Badge className={`${statusColors[t.status]} ring-1`}>
                        {TENANT_STATUS[t.status as keyof typeof TENANT_STATUS]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ActivityIcon className="size-4 text-amber-600" />
              مكاتب خاملة (لم تدخل منذ أكثر من 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.inactiveTenants.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                كل المكاتب نشطة 🎉
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.inactiveTenants.map((t) => (
                  <Link
                    key={t.id}
                    href={`/admin/tenants/${t.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {t.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`${statusColors[t.status]} ring-1`}>
                        {TENANT_STATUS[t.status as keyof typeof TENANT_STATUS]}
                      </Badge>
                      <span className="text-xs text-red-600">
                        {t.lastActivityAt
                          ? formatRelativeTime(t.lastActivityAt)
                          : "لم يدخل أبداً"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="size-4 text-amber-600" />
              اشتراكات تنتهي خلال 30 يوم
            </CardTitle>
            <Link
              href="/admin/subscriptions"
              className="text-sm text-amber-700 hover:underline"
            >
              عرض الكل
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.expiringSubs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              لا توجد اشتراكات تنتهي قريباً
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.expiringSubs.map((t) => {
                const endDate =
                  t.status === "TRIAL" ? t.trialEndsAt : t.subscriptionEnd;
                const days = daysUntil(endDate);
                const urgent = days !== null && days <= 7;
                return (
                  <Link
                    key={t.id}
                    href={`/admin/tenants/${t.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {t.email} · {formatCurrency(Number(t.monthlyPrice))}/شهر
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-slate-100 text-slate-700">
                        {PLANS[t.plan as keyof typeof PLANS]?.name ?? t.plan}
                      </Badge>
                      <Badge className={`${statusColors[t.status]} ring-1`}>
                        {TENANT_STATUS[t.status as keyof typeof TENANT_STATUS]}
                      </Badge>
                      <span
                        className={`text-xs font-medium tabular-nums ${
                          urgent ? "text-red-600" : "text-amber-700"
                        }`}
                      >
                        {days !== null ? `${days} يوم` : "—"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {endDate ? formatDate(endDate) : "—"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
  color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 truncate">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums truncate">
            {value}
          </p>
        </div>
        <div
          className={`size-12 rounded-lg grid place-items-center shrink-0 ${color}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
