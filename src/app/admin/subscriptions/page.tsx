import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAllSubscriptions } from "@/services/admin-service";
import { PLANS, TENANT_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { SubscriptionQuickActions } from "./subscription-quick-actions";

const statusColors: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const FILTER_LABELS = {
  all: "الكل",
  active: "نشط",
  trial: "تجريبي",
  expiring_3: "تجارب تنتهي خلال 3 أيام",
  expiring: "ينتهي خلال 30 يوم",
  expired_trial: "تجارب منتهية",
  expired: "اشتراك منتهي",
  suspended: "معلق",
} as const;

type FilterKey = keyof typeof FILTER_LABELS;

interface PageProps {
  searchParams: Promise<{ filter?: FilterKey }>;
}

function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function colorForDays(days: number | null): string {
  if (days === null) return "text-slate-500";
  if (days < 0) return "text-red-700 font-bold";
  if (days < 30) return "text-red-600";
  if (days <= 60) return "text-amber-700";
  return "text-emerald-700";
}

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = params.filter ?? "all";
  const tenants = await listAllSubscriptions({ filter });

  const counts = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "ACTIVE").length,
    trial: tenants.filter((t) => t.status === "TRIAL").length,
    expiring: tenants.filter((t) => {
      const end = t.status === "TRIAL" ? t.trialEndsAt : t.subscriptionEnd;
      const days = daysUntil(end);
      return days !== null && days >= 0 && days <= 30;
    }).length,
    expiringSoon: tenants.filter((t) => {
      if (t.status !== "TRIAL") return false;
      const days = daysUntil(t.trialEndsAt);
      return days !== null && days >= 0 && days <= 3;
    }).length,
    expiredTrial: tenants.filter((t) => {
      if (t.status !== "TRIAL") return false;
      const days = daysUntil(t.trialEndsAt);
      return days !== null && days < 0;
    }).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="size-7 text-amber-600" />
          الاشتراكات
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          متابعة الاشتراكات والأيام المتبقية لكل مكتب
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">إجمالي</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {counts.total}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">النشطة</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {counts.active}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">التجريبية</p>
          <p className="text-2xl font-bold text-amber-700 tabular-nums mt-1">
            {counts.trial}
          </p>
        </Card>
        <Link href="?filter=expiring_3">
          <Card className="p-4 border-amber-200 hover:bg-amber-50 transition-colors cursor-pointer">
            <p className="text-sm text-slate-500">تنتهي خلال 3 أيام</p>
            <p className="text-2xl font-bold text-amber-700 tabular-nums mt-1">
              {counts.expiringSoon}
            </p>
          </Card>
        </Link>
        <Link href="?filter=expired_trial">
          <Card className="p-4 border-red-200 hover:bg-red-50 transition-colors cursor-pointer">
            <p className="text-sm text-slate-500">تجارب منتهية</p>
            <p className="text-2xl font-bold text-red-700 tabular-nums mt-1">
              {counts.expiredTrial}
            </p>
          </Card>
        </Link>
      </div>

      <Card className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(FILTER_LABELS).map(([k, v]) => {
            const active = filter === k;
            return (
              <Link
                key={k}
                href={k === "all" ? "/admin/subscriptions" : `?filter=${k}`}
                className={
                  active
                    ? "px-3 py-1.5 rounded-md text-sm font-medium bg-amber-600 text-white"
                    : "px-3 py-1.5 rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                }
              >
                {v}
              </Link>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-emerald-500" /> أكثر من 60 يوم
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-amber-500" /> 30-60 يوم
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-red-500" /> أقل من 30 يوم / منتهي
          </span>
        </div>
        {tenants.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12">
            لا توجد اشتراكات تطابق التصفية
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                  <th className="px-3 py-3">المكتب</th>
                  <th className="px-3 py-3">الباقة</th>
                  <th className="px-3 py-3">الحالة</th>
                  <th className="px-3 py-3">السعر</th>
                  <th className="px-3 py-3">نهاية الاشتراك</th>
                  <th className="px-3 py-3 text-center">الأيام المتبقية</th>
                  <th className="px-3 py-3 text-center">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t) => {
                  const end =
                    t.status === "TRIAL" ? t.trialEndsAt : t.subscriptionEnd;
                  const days = daysUntil(end);
                  const colorClass = colorForDays(days);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="font-medium text-slate-900 hover:text-amber-700"
                        >
                          {t.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {t.email} · {t.city}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className="bg-slate-100 text-slate-700">
                          {PLANS[t.plan]?.name ?? t.plan}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={`${statusColors[t.status]} ring-1`}>
                          {TENANT_STATUS[t.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-700">
                        {formatCurrency(Number(t.monthlyPrice))}
                      </td>
                      <td className="px-3 py-3 text-slate-700 text-xs">
                        {end ? formatDate(end) : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {days !== null ? (
                          <span
                            className={`tabular-nums font-medium ${colorClass}`}
                          >
                            {days >= 0
                              ? `${days} يوم`
                              : `منتهي ${-days} يوم`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <SubscriptionQuickActions
                          tenantId={t.id}
                          status={t.status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
