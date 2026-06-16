import {
  BarChart3,
  Briefcase,
  Gavel,
  TrendingUp,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTenantId } from "@/lib/tenant";
import { getReportsOverview } from "@/services/reports-service";
import { getFinanceStats } from "@/services/invoice-service";
import { CASE_STATUS, CASE_TYPES, USER_ROLES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { UserRole } from "@prisma/client";
import { CasesPieChart } from "@/components/charts/cases-pie-chart";
import { CasesBarChart } from "@/components/charts/cases-bar-chart";
import { MonthlyLineChart } from "@/components/charts/monthly-line-chart";

export default async function ReportsPage() {
  const tenantId = await getTenantId();
  const [overview, finance] = await Promise.all([
    getReportsOverview(tenantId),
    getFinanceStats(tenantId),
  ]);

  const totalCases = overview.casesByStatus.reduce(
    (sum, s) => sum + s._count,
    0,
  );

  const statusData = overview.casesByStatus.map((s) => ({
    name: CASE_STATUS[s.status as keyof typeof CASE_STATUS] ?? s.status,
    value: s._count,
  }));

  const typeData = overview.casesByType.map((t) => ({
    name: CASE_TYPES[t.caseType as keyof typeof CASE_TYPES] ?? t.caseType,
    value: t._count,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "التقارير" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="size-7 text-brand-600" />
          التقارير والتحليلات
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          نظرة شاملة على أداء المكتب والقضايا والمالية
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          color="bg-blue-50 text-blue-700"
          label="إجمالي القضايا"
          value={String(totalCases)}
        />
        <StatCard
          icon={Gavel}
          color="bg-violet-50 text-violet-700"
          label="جلسات قادمة"
          value={String(overview.upcomingSessions)}
        />
        <StatCard
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-700"
          label="جلسات منتهية"
          value={String(overview.completedSessions)}
        />
        <StatCard
          icon={TrendingUp}
          color="bg-amber-50 text-amber-700"
          label="إجمالي المحصّل"
          value={formatCurrency(finance.paid)}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">القضايا حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">
                لا توجد بيانات
              </p>
            ) : (
              <CasesPieChart data={typeData} height={300} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">القضايا حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">
                لا توجد بيانات
              </p>
            ) : (
              <CasesBarChart data={statusData} height={300} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            الإيرادات الشهرية (آخر 6 أشهر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overview.monthlyInvoices.every((m) => m.total === 0) ? (
            <p className="text-sm text-slate-500 text-center py-12">
              لا توجد فواتير لعرض التقرير الشهري
            </p>
          ) : (
            <MonthlyLineChart data={overview.monthlyInvoices} height={320} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4 text-slate-500" />
            أداء المحامين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overview.lawyerPerformance.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              لا يوجد أعضاء فريق نشطون
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                    <th className="pb-3">الاسم</th>
                    <th className="pb-3">الدور</th>
                    <th className="pb-3 tabular-nums">القضايا</th>
                    <th className="pb-3 tabular-nums">الجلسات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.lawyerPerformance.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3 font-medium text-slate-900">
                        {l.name}
                      </td>
                      <td className="py-3">
                        <Badge className="bg-slate-100 text-slate-700">
                          {USER_ROLES[l.role as UserRole] ?? l.role}
                        </Badge>
                      </td>
                      <td className="py-3 tabular-nums text-slate-700">
                        {l.caseCount}
                      </td>
                      <td className="py-3 tabular-nums text-slate-700">
                        {l.sessionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Briefcase;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {value}
          </p>
        </div>
        <div className={`size-12 rounded-lg grid place-items-center ${color}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
