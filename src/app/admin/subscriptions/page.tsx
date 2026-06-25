import Link from "next/link";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarClock,
  CircleAlert,
  CircleCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAllSubscriptions } from "@/services/admin-service";
import { PLANS, TENANT_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { SubscriptionQuickActions } from "./subscription-quick-actions";
import { cn } from "@/lib/utils";

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
  expiring_3: "تنتهي خلال 3 أيام",
  expiring: "تنتهي خلال 30 يوم",
  expired_trial: "تجارب منتهية",
  expired: "اشتراك منتهي",
  suspended: "معلق",
} as const;

const FILTER_TONES: Record<keyof typeof FILTER_LABELS, string> = {
  all: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  active: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200",
  trial: "bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-200",
  expiring_3: "bg-orange-50 text-orange-700 hover:bg-orange-100 ring-1 ring-orange-200",
  expiring: "bg-yellow-50 text-yellow-800 hover:bg-yellow-100 ring-1 ring-yellow-200",
  expired_trial: "bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-200",
  expired: "bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-200",
  suspended: "bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-200",
};

type FilterKey = keyof typeof FILTER_LABELS;

interface PageProps {
  searchParams: Promise<{ filter?: FilterKey }>;
}

function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function badgeForDays(days: number | null) {
  if (days === null)
    return {
      cls: "bg-slate-100 text-slate-500 ring-slate-200",
      icon: Clock,
      label: "—",
    };
  if (days < 0)
    return {
      cls: "bg-red-50 text-red-700 ring-red-200",
      icon: CircleAlert,
      label: `منتهي منذ ${-days} يوم`,
    };
  if (days < 30)
    return {
      cls: "bg-red-50 text-red-700 ring-red-200",
      icon: CircleAlert,
      label: `${days} يوم`,
    };
  if (days <= 60)
    return {
      cls: "bg-yellow-50 text-yellow-800 ring-yellow-200",
      icon: Clock,
      label: `${days} يوم`,
    };
  return {
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CircleCheck,
    label: `${days} يوم`,
  };
}

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = params.filter ?? "all";
  const tenants = await listAllSubscriptions({ filter });

  const counts = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "ACTIVE").length,
    trial: tenants.filter((t) => t.status === "TRIAL").length,
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
    <div className="space-y-6 animate-fade-in-page">
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-admin-gold-gradient text-white grid place-items-center shadow-gold shrink-0">
          <CreditCard className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الاشتراكات</h1>
          <p className="text-sm text-slate-500 mt-1">
            متابعة الاشتراكات والأيام المتبقية لكل مكتب
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          icon={Building2}
          label="إجمالي المكاتب"
          value={counts.total}
          tone="slate"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="النشطة"
          value={counts.active}
          tone="emerald"
        />
        <SummaryCard
          icon={Clock}
          label="التجريبية"
          value={counts.trial}
          tone="amber"
        />
        <Link href="?filter=expiring_3">
          <SummaryCard
            icon={CalendarClock}
            label="تنتهي خلال 3 أيام"
            value={counts.expiringSoon}
            tone="orange"
            interactive
          />
        </Link>
        <Link href="?filter=expired_trial">
          <SummaryCard
            icon={AlertCircle}
            label="تجارب منتهية"
            value={counts.expiredTrial}
            tone="red"
            interactive
          />
        </Link>
      </div>

      <Card className="p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(FILTER_LABELS).map(([k, v]) => {
            const key = k as FilterKey;
            const active = filter === key;
            return (
              <Link
                key={k}
                href={k === "all" ? "/admin/subscriptions" : `?filter=${k}`}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105",
                  active
                    ? "bg-admin-gold-gradient text-white shadow-gold ring-1 ring-amber-400/40"
                    : FILTER_TONES[key],
                )}
              >
                {v}
              </Link>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-500 flex-wrap bg-slate-50/50">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            أكثر من 60 يوم
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-yellow-500" />
            30–60 يوم
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500" />
            أقل من 30 يوم / منتهي
          </span>
        </div>
        {tenants.length === 0 ? (
          <div className="text-center py-16">
            <div className="size-14 mx-auto rounded-full bg-slate-100 grid place-items-center mb-3">
              <CreditCard className="size-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">
              لا توجد اشتراكات تطابق التصفية الحالية
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-striped">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  <th className="px-4 py-3.5">المكتب</th>
                  <th className="px-4 py-3.5">الباقة</th>
                  <th className="px-4 py-3.5">الحالة</th>
                  <th className="px-4 py-3.5">السعر</th>
                  <th className="px-4 py-3.5">نهاية الاشتراك</th>
                  <th className="px-4 py-3.5 text-center">الأيام المتبقية</th>
                  <th className="px-4 py-3.5 text-center">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t) => {
                  const end =
                    t.status === "TRIAL" ? t.trialEndsAt : t.subscriptionEnd;
                  const days = daysUntil(end);
                  const badge = badgeForDays(days);
                  const BadgeIcon = badge.icon;
                  return (
                    <tr
                      key={t.id}
                      className="transition-colors duration-150"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-admin-gold-gradient text-white grid place-items-center text-sm font-bold shrink-0 shadow-gold/50">
                            {t.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/tenants/${t.id}`}
                              className="font-semibold text-slate-900 hover:text-amber-700 transition-colors truncate block"
                            >
                              {t.name}
                            </Link>
                            <p className="text-xs text-slate-500 truncate">
                              {t.email} · {t.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className="bg-slate-100 text-slate-700 font-medium">
                          {PLANS[t.plan]?.name ?? t.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={`${statusColors[t.status]} ring-1`}>
                          {TENANT_STATUS[t.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-slate-700 font-medium">
                        {formatCurrency(Number(t.monthlyPrice))}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs tabular-nums">
                        {end ? formatDate(end) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 tabular-nums",
                            badge.cls,
                          )}
                        >
                          <BadgeIcon className="size-3.5" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
  interactive,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "orange" | "red";
  interactive?: boolean;
}) {
  const styles = {
    slate: { bg: "bg-slate-100", text: "text-slate-600", value: "text-slate-900" },
    emerald: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      value: "text-emerald-700",
    },
    amber: { bg: "bg-amber-100", text: "text-amber-700", value: "text-amber-700" },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      value: "text-orange-700",
    },
    red: { bg: "bg-red-100", text: "text-red-700", value: "text-red-700" },
  }[tone];

  return (
    <Card
      className={cn(
        "p-5 rounded-2xl card-lift",
        interactive && "cursor-pointer hover:border-amber-300 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate font-medium">{label}</p>
          <p className={cn("text-3xl font-extrabold tabular-nums mt-2", styles.value)}>
            {value}
          </p>
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
