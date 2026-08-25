import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  Gavel,
  Users,
  Wallet,
  Calendar,
  ChevronLeft,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity as ActivityIcon,
  ShieldCheck,
  Landmark,
  MessagesSquare,
  Headphones,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant";
import { getDashboardOverview } from "@/services/reports-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { TodayTasksWidget } from "@/components/dashboard/today-tasks";
import { SessionsWidget } from "@/components/dashboard/sessions-widget";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { CASE_STATUS, CASE_TYPES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-200",
  ON_HOLD: "bg-slate-100 text-slate-700 ring-slate-200",
  WON: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LOST: "bg-red-50 text-red-700 ring-red-200",
  SETTLED: "bg-violet-50 text-violet-700 ring-violet-200",
  CLOSED: "bg-slate-100 text-slate-700 ring-slate-200",
  APPEALED: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

export default async function DashboardPage() {
  const session = await auth();
  const tenantId = await getTenantId();
  const data = await getDashboardOverview(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          أهلاً، {session?.user.name} 👋
        </h1>
        <p className="text-slate-500 mt-1">هذه نظرة عامة على مكتبك اليوم</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          label="القضايا الجارية"
          value={String(data.stats.activeCases)}
          gradient="from-blue-500 to-blue-600"
          ringColor="ring-blue-100"
          iconBg="bg-blue-50 text-blue-600"
          href="/dashboard/cases"
        />
        <StatCard
          icon={Gavel}
          label="جلسات اليوم"
          value={String(data.stats.todaySessions)}
          gradient="from-amber-500 to-amber-600"
          ringColor="ring-amber-100"
          iconBg="bg-amber-50 text-amber-600"
          href="/dashboard/sessions"
        />
        <StatCard
          icon={Users}
          label="عملاء نشطين"
          value={String(data.stats.activeClients)}
          gradient="from-violet-500 to-violet-600"
          ringColor="ring-violet-100"
          iconBg="bg-violet-50 text-violet-600"
          href="/dashboard/clients"
        />
        <StatCard
          icon={Wallet}
          label="إيرادات الشهر"
          value={formatCurrency(data.stats.monthRevenue)}
          gradient="from-emerald-500 to-emerald-600"
          ringColor="ring-emerald-100"
          iconBg="bg-emerald-50 text-emerald-600"
          href="/dashboard/finance"
        />
        <StatCard
          icon={ShieldCheck}
          label="الوكالات السارية"
          value={String(data.stats.activePoa)}
          gradient="from-teal-500 to-teal-600"
          ringColor="ring-teal-100"
          iconBg="bg-teal-50 text-teal-600"
          href="/dashboard/powers-of-attorney"
        />
        <StatCard
          icon={Landmark}
          label="طلبات التنفيذ النشطة"
          value={String(data.stats.activeExecutions)}
          gradient="from-orange-500 to-orange-600"
          ringColor="ring-orange-100"
          iconBg="bg-orange-50 text-orange-600"
          href="/dashboard/cases?caseType=EXECUTION"
        />
        <StatCard
          icon={MessagesSquare}
          label="الاستشارات القائمة"
          value={String(data.stats.activeConsultations)}
          gradient="from-indigo-500 to-indigo-600"
          ringColor="ring-indigo-100"
          iconBg="bg-indigo-50 text-indigo-600"
          href="/dashboard/consultations"
        />
        <StatCard
          icon={Headphones}
          label="طلبات العملاء المفتوحة"
          value={String(data.stats.openServiceRequests)}
          gradient="from-rose-500 to-rose-600"
          ringColor="ring-rose-100"
          iconBg="bg-rose-50 text-rose-600"
          href="/dashboard/client-requests"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600" />
                الإيرادات الشهرية (آخر 6 أشهر)
              </CardTitle>
              <Link
                href="/dashboard/reports"
                className="text-xs text-brand-600 hover:underline"
              >
                تقارير تفصيلية
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.monthlyInvoices.every((m) => m.total === 0) ? (
              <p className="text-sm text-slate-500 text-center py-12">
                لا توجد فواتير لعرض المخطط
              </p>
            ) : (
              <MonthlyRevenueChart
                data={data.monthlyInvoices}
                variant="dual"
                color="#93c5fd"
                paidColor="#10b981"
                totalLabel="الفواتير"
                paidLabel="المحصّل"
                height={280}
              />
            )}
          </CardContent>
        </Card>

        <Card className="card-lift">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-amber-600" />
              مهام اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TodayTasksWidget tasks={data.todayTasks} />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="card-lift">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-4 text-brand-600" />
              الجلسات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SessionsWidget
              upcoming={data.upcomingSessions}
              today={data.todaySessions}
            />
          </CardContent>
        </Card>

        <Card className="card-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="size-4 text-violet-600" />
                آخر القضايا المضافة
              </CardTitle>
              <Link
                href="/dashboard/cases"
                className="text-xs text-brand-600 hover:underline flex items-center gap-0.5"
              >
                عرض الكل
                <ChevronLeft className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentCases.length === 0 ? (
              <div className="flex items-start gap-2 rounded-md bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>لا توجد قضايا بعد</span>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentCases.map((c) => (
                  <li key={c.id} className="py-3 flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-violet-50 text-violet-700 grid place-items-center shrink-0 font-mono text-xs font-bold">
                      {c.caseNumber.split("-").pop()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/cases/${c.id}`}
                        className="font-medium text-slate-900 truncate block hover:text-brand-600"
                      >
                        {c.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.client.name} ·{" "}
                        {CASE_TYPES[c.caseType as keyof typeof CASE_TYPES] ??
                          c.caseType}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          className={`${statusColors[c.status]} ring-1 text-xs`}
                        >
                          {CASE_STATUS[c.status as keyof typeof CASE_STATUS] ??
                            c.status}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="card-lift">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ActivityIcon className="size-4 text-emerald-600" />
              آخر الأنشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity items={data.recentActivities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  ringColor,
  iconBg,
  href,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  gradient: string;
  ringColor: string;
  iconBg: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className={`card-lift cursor-pointer overflow-hidden ring-1 ${ringColor}`}>
        <CardContent className="p-6 relative">
          <div
            aria-hidden="true"
            className={`absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`}
          />
          <div className="flex items-center justify-between relative">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums truncate">
                {value}
              </p>
            </div>
            <div
              className={`size-12 rounded-xl grid place-items-center shrink-0 ${iconBg}`}
            >
              <Icon className="size-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
