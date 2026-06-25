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
  ArrowUpRight,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlatformStats } from "@/services/admin-service";
import { PLANS, TENANT_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { CasesPieChart } from "@/components/charts/cases-pie-chart";
import { TenantGrowthChart } from "@/components/admin/tenant-growth-chart";
import { cn } from "@/lib/utils";

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

  // growth: last month vs previous
  const growthArr = stats.monthlyGrowth ?? [];
  const lastMonth = growthArr[growthArr.length - 1]?.count ?? 0;
  const prevMonth = growthArr[growthArr.length - 2]?.count ?? 0;
  const growthDelta = lastMonth - prevMonth;

  return (
    <div className="space-y-6 animate-fade-in-page">
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-admin-gold-gradient text-white grid place-items-center shadow-gold shrink-0">
          <Sparkles className="size-7" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            لوحة تحكم المنصة
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            نظرة شاملة على المكاتب والإيرادات والمستخدمين
          </p>
        </div>
      </div>

      <Card className="rounded-3xl p-6 bg-admin-mrr-gradient border-amber-300/60 shadow-gold relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_60%)] pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-white/40 backdrop-blur ring-1 ring-white/60 grid place-items-center shadow-inner">
              <CreditCard className="size-8 text-amber-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900/80 uppercase tracking-wide">
                الإيراد الشهري المتكرر
              </p>
              <p className="text-4xl lg:text-5xl font-extrabold text-amber-950 tabular-nums mt-1 leading-none">
                {formatCurrency(stats.monthlyRecurringRevenue)}
              </p>
              <p className="text-xs text-amber-800/70 mt-2">
                إجمالي القيمة الشهرية للمشتركين النشطين
              </p>
            </div>
          </div>
          <Link
            href="/admin/revenue"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-900 text-amber-50 text-sm font-semibold hover:bg-amber-950 transition-all hover:scale-105 shadow-lg"
          >
            تقرير الإيرادات
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي المكاتب"
          value={stats.totalTenants}
          icon={Building2}
          tone="blue"
          deltaLabel={
            growthDelta > 0
              ? `+${growthDelta} هذا الشهر`
              : growthDelta < 0
                ? `${growthDelta} هذا الشهر`
                : "بدون تغير"
          }
          deltaPositive={growthDelta >= 0}
        />
        <StatCard
          label="المكاتب النشطة"
          value={stats.activeTenants}
          icon={Building2}
          tone="emerald"
        />
        <StatCard
          label="المكاتب التجريبية"
          value={stats.trialTenants}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="المنتهية / المعلقة"
          value={stats.expiredTenants + stats.suspendedTenants}
          icon={AlertCircle}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي المستخدمين"
          value={stats.totalUsers}
          icon={Users}
          tone="violet"
        />
        <StatCard
          label="نشطون (آخر 7 أيام)"
          value={stats.activeUsers}
          icon={UserCheck}
          tone="cyan"
        />
        <StatCard
          label="إجمالي القضايا"
          value={stats.totalCases}
          icon={Briefcase}
          tone="indigo"
        />
        <StatCard
          label="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={Wallet}
          tone="emerald"
          isCurrency
        />
      </div>

      {(stats.expiredTrialsCount > 0 || stats.trialsExpiringSoonCount > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {stats.expiredTrialsCount > 0 && (
            <Card className="p-5 rounded-2xl border-red-200 bg-gradient-to-br from-red-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-12 rounded-xl bg-red-100 text-red-700 grid place-items-center shrink-0">
                    <AlertCircle className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-red-900 font-semibold">
                      مكاتب انتهت تجربتها ولم تشترك
                    </p>
                    <p className="text-3xl font-extrabold text-red-700 tabular-nums mt-1">
                      {stats.expiredTrialsCount}
                      <span className="text-base font-medium text-red-600 ms-1">مكتب</span>
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/subscriptions?filter=expired_trial"
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                >
                  عرض القائمة
                  <ChevronLeft className="size-3.5" />
                </Link>
              </div>
            </Card>
          )}
          {stats.trialsExpiringSoonCount > 0 && (
            <Card className="p-5 rounded-2xl border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-12 rounded-xl bg-amber-100 text-amber-700 grid place-items-center shrink-0">
                    <CalendarClock className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-amber-900 font-semibold">
                      تنتهي تجربتها خلال 3 أيام
                    </p>
                    <p className="text-3xl font-extrabold text-amber-700 tabular-nums mt-1">
                      {stats.trialsExpiringSoonCount}
                      <span className="text-base font-medium text-amber-600 ms-1">مكتب</span>
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/subscriptions?filter=expiring_3"
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                >
                  عرض القائمة
                  <ChevronLeft className="size-3.5" />
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-8 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
                <TrendingUp className="size-4" />
              </span>
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

        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-8 rounded-lg bg-amber-100 text-amber-700 grid place-items-center">
                <Wallet className="size-4" />
              </span>
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
        <Card className="rounded-2xl shadow-sm">
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
                <div className="mt-4 space-y-2">
                  {stats.byPlan.map((p) => (
                    <div
                      key={p.plan}
                      className="flex items-center justify-between text-sm pb-2 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-slate-700 font-medium">
                        {PLANS[p.plan as keyof typeof PLANS]?.name ?? p.plan}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 tabular-nums">
                          {p._count}
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

        <Card className="lg:col-span-2 rounded-2xl shadow-sm">
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
                    className="p-4 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white text-center hover:shadow-sm transition-shadow"
                  >
                    <Badge className={`${statusColors[s.status]} ring-1 mb-2`}>
                      {TENANT_STATUS[s.status as keyof typeof TENANT_STATUS]}
                    </Badge>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
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
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">آخر المكاتب المسجلة</CardTitle>
              <Link
                href="/admin/tenants"
                className="text-sm text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
              >
                عرض الكل
                <ChevronLeft className="size-3.5" />
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
                    className="flex items-center gap-3 py-3 hover:bg-amber-50/40 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="size-10 rounded-full bg-admin-gold-gradient text-white grid place-items-center text-sm font-bold shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
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

        <Card className="rounded-2xl shadow-sm border-amber-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-8 rounded-lg bg-amber-100 text-amber-700 grid place-items-center">
                <ActivityIcon className="size-4" />
              </span>
              مكاتب خاملة (أكثر من 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.inactiveTenants.length === 0 ? (
              <p className="text-sm text-emerald-700 text-center py-6 font-medium">
                كل المكاتب نشطة 🎉
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.inactiveTenants.map((t) => (
                  <Link
                    key={t.id}
                    href={`/admin/tenants/${t.id}`}
                    className="flex items-center gap-3 py-3 hover:bg-amber-50/40 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="size-10 rounded-full bg-slate-200 text-slate-600 grid place-items-center text-sm font-bold shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
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
                      <span className="text-xs text-red-600 font-medium">
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

      <Card className="rounded-2xl shadow-sm border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="size-8 rounded-lg bg-amber-100 text-amber-700 grid place-items-center">
                <CalendarClock className="size-4" />
              </span>
              اشتراكات تنتهي خلال 30 يوم
            </CardTitle>
            <Link
              href="/admin/subscriptions"
              className="text-sm text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
            >
              عرض الكل
              <ChevronLeft className="size-3.5" />
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
                    className="flex items-center gap-3 py-3 hover:bg-amber-50/40 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="size-10 rounded-full bg-admin-gold-gradient text-white grid place-items-center text-sm font-bold shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {t.email} · {formatCurrency(Number(t.monthlyPrice))}/شهر
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <Badge className="bg-slate-100 text-slate-700">
                        {PLANS[t.plan as keyof typeof PLANS]?.name ?? t.plan}
                      </Badge>
                      <Badge className={`${statusColors[t.status]} ring-1`}>
                        {TENANT_STATUS[t.status as keyof typeof TENANT_STATUS]}
                      </Badge>
                      <span
                        className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
                          urgent
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {days !== null ? `${days} يوم` : "—"}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
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
  tone,
  deltaLabel,
  deltaPositive,
  isCurrency,
}: {
  label: string;
  value: number | string;
  icon: typeof Building2;
  tone: "blue" | "emerald" | "amber" | "red" | "violet" | "cyan" | "indigo";
  deltaLabel?: string;
  deltaPositive?: boolean;
  isCurrency?: boolean;
}) {
  const styles = {
    blue: { bg: "bg-blue-100", text: "text-blue-700" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700" },
    amber: { bg: "bg-amber-100", text: "text-amber-700" },
    red: { bg: "bg-red-100", text: "text-red-700" },
    violet: { bg: "bg-violet-100", text: "text-violet-700" },
    cyan: { bg: "bg-cyan-100", text: "text-cyan-700" },
    indigo: { bg: "bg-indigo-100", text: "text-indigo-700" },
  }[tone];

  return (
    <Card className="p-5 rounded-2xl card-lift hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p
            className={cn(
              "font-extrabold text-slate-900 mt-2 tabular-nums truncate leading-none",
              isCurrency ? "text-xl" : "text-3xl",
            )}
          >
            {value}
          </p>
          {deltaLabel && (
            <div
              className={cn(
                "inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2 py-0.5 rounded-full",
                deltaPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700",
              )}
            >
              {deltaPositive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowUpRight className="size-3 rotate-180" />
              )}
              {deltaLabel}
            </div>
          )}
        </div>
        <div
          className={cn(
            "size-12 rounded-full grid place-items-center shrink-0",
            styles.bg,
            styles.text,
          )}
        >
          <Icon className="size-6" />
        </div>
      </div>
    </Card>
  );
}
