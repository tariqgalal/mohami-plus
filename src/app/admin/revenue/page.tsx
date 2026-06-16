import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Wallet,
  CheckCircle2,
  Layers,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getPlatformStats,
  listAllPayments,
  getRevenueBreakdown,
  getMonthlyRevenueRange,
  getAverageRevenuePerTenant,
} from "@/services/admin-service";
import { PLANS } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { MonthlyLineChart } from "@/components/charts/monthly-line-chart";
import { CasesPieChart } from "@/components/charts/cases-pie-chart";

export default async function RevenuePage() {
  const [stats, payments, breakdown, twelveMonths, avgRevenue] =
    await Promise.all([
      getPlatformStats(),
      listAllPayments({ page: 1, limit: 50 }),
      getRevenueBreakdown(),
      getMonthlyRevenueRange(12),
      getAverageRevenuePerTenant(),
    ]);

  const chartData = stats.monthlyRevenue.map((m) => ({
    month: m.month,
    total: m.amount,
    paid: m.amount,
  }));

  const twelveMonthsData = twelveMonths.map((m) => ({
    month: m.month,
    total: m.amount,
    paid: m.amount,
  }));

  const totalYear = twelveMonths.reduce((s, m) => s + m.amount, 0);

  const pieData = breakdown.byPlan.map((b) => ({
    name: PLANS[b.plan as keyof typeof PLANS]?.name ?? b.plan,
    value: b.amount,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="size-7 text-amber-600" />
          الإيرادات
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          إيرادات المنصة من اشتراكات المكاتب
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Wallet}
          color="bg-emerald-50 text-emerald-700"
          label="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
        />
        <StatCard
          icon={TrendingUp}
          color="bg-blue-50 text-blue-700"
          label="إيراد آخر 12 شهر"
          value={formatCurrency(totalYear)}
        />
        <StatCard
          icon={DollarSign}
          color="bg-amber-50 text-amber-700"
          label="الإيراد الشهري المتكرر"
          value={formatCurrency(stats.monthlyRecurringRevenue)}
        />
        <StatCard
          icon={Wallet}
          color="bg-violet-50 text-violet-700"
          label="متوسط الإيراد/مكتب"
          value={formatCurrency(avgRevenue)}
        />
        <StatCard
          icon={CheckCircle2}
          color="bg-cyan-50 text-cyan-700"
          label="المكاتب النشطة"
          value={String(stats.activeTenants)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            الإيرادات الشهرية (آخر 12 شهر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {twelveMonths.every((m) => m.amount === 0) ? (
            <p className="text-sm text-slate-500 text-center py-12">
              لا توجد مدفوعات لعرض التقرير
            </p>
          ) : (
            <MonthlyLineChart data={twelveMonthsData} height={300} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            الإيرادات الشهرية (آخر 6 أشهر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.monthlyRevenue.every((m) => m.amount === 0) ? (
            <p className="text-sm text-slate-500 text-center py-12">
              لا توجد مدفوعات لعرض التقرير
            </p>
          ) : (
            <MonthlyRevenueChart
              data={chartData}
              variant="single"
              color="#d97706"
              totalLabel="الإيرادات"
              showLegend={false}
              height={280}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="size-4 text-amber-600" />
              الإيرادات حسب الباقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">
                لا توجد بيانات
              </p>
            ) : (
              <>
                <CasesPieChart data={pieData} height={260} />
                <div className="mt-4 space-y-2">
                  {breakdown.byPlan.map((b) => (
                    <div
                      key={b.plan}
                      className="flex items-center justify-between text-sm pb-2 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-slate-700">
                        {PLANS[b.plan as keyof typeof PLANS]?.name ?? b.plan}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {b.count} عملية
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(b.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="size-4 text-amber-600" />
              أعلى المكاتب إيراداً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.topTenants.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">
                لا توجد بيانات
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {breakdown.topTenants.map((t, idx) =>
                  t.tenant ? (
                    <li
                      key={t.tenant.id}
                      className="py-3 flex items-center gap-3"
                    >
                      <div className="size-8 rounded-md bg-amber-50 text-amber-700 grid place-items-center font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/tenants/${t.tenant.id}`}
                          className="font-medium text-slate-900 truncate block hover:text-amber-700"
                        >
                          {t.tenant.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {PLANS[t.tenant.plan as keyof typeof PLANS]?.name ??
                            t.tenant.plan}{" "}
                          · {t.count} عملية
                        </p>
                      </div>
                      <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                        {formatCurrency(t.amount)}
                      </span>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              لا توجد مدفوعات بعد
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                    <th className="pb-3">المكتب</th>
                    <th className="pb-3">المبلغ</th>
                    <th className="pb-3">الباقة</th>
                    <th className="pb-3">المدة</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.items.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3">
                        <Link
                          href={`/admin/tenants/${p.tenant.id}`}
                          className="font-medium text-slate-900 hover:text-amber-700"
                        >
                          {p.tenant.name}
                        </Link>
                      </td>
                      <td className="py-3 font-medium tabular-nums">
                        {formatCurrency(Number(p.amount))}
                      </td>
                      <td className="py-3">
                        <Badge className="bg-slate-100 text-slate-700">
                          {PLANS[p.plan]?.name ?? p.plan}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-700">{p.period}</td>
                      <td className="py-3">
                        <Badge
                          className={
                            p.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {formatDateTime(p.createdAt)}
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
  icon: typeof Wallet;
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
