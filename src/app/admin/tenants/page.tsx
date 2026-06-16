import Link from "next/link";
import {
  Building2,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { listTenants } from "@/services/admin-service";
import { PLANS, TENANT_STATUS, SAUDI_CITIES } from "@/lib/constants";
import {
  formatDate,
  formatCurrency,
  formatRelativeTime,
  formatFileSize,
} from "@/lib/format";
import { TenantRowActions } from "./tenant-row-actions";

const statusColors: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const SORT_OPTIONS = {
  recent: "الأحدث",
  name: "الاسم",
  users: "أكثر مستخدمين",
  revenue: "أعلى إيراد",
  expiring: "أقرب انتهاء",
} as const;

const ACTIVITY_OPTIONS = {
  active: "نشط (آخر 7 أيام)",
  idle: "خامل (7-30 يوم)",
  inactive: "غير نشط (>30 يوم)",
} as const;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    plan?: string;
    city?: string;
    activity?: "active" | "idle" | "inactive";
    sort?: "recent" | "name" | "users" | "revenue" | "expiring";
    page?: string;
  }>;
}

function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil(
    (new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
}

function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.floor(
    (Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000),
  );
}

export default async function TenantsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await listTenants({
    q: params.q,
    status: params.status,
    plan: params.plan,
    city: params.city,
    activity: params.activity,
    sort: params.sort ?? "recent",
    page: Number(params.page ?? 1),
    limit: 25,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="size-7 text-amber-600" />
          المكاتب المشتركة
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {result.total} مكتب · فلترة وترتيب وإدارة سريعة
        </p>
      </div>

      <Card className="p-4">
        <form className="grid gap-3 lg:grid-cols-7">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="بحث بالاسم، البريد، أو الهاتف..."
            className="lg:col-span-2 h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
          >
            <option value="">كل الحالات</option>
            {Object.entries(TENANT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            name="plan"
            defaultValue={params.plan ?? ""}
            className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
          >
            <option value="">كل الباقات</option>
            {Object.entries(PLANS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
          <select
            name="city"
            defaultValue={params.city ?? ""}
            className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
          >
            <option value="">كل المدن</option>
            {SAUDI_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            name="activity"
            defaultValue={params.activity ?? ""}
            className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
          >
            <option value="">كل النشاط</option>
            {Object.entries(ACTIVITY_OPTIONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              name="sort"
              defaultValue={params.sort ?? "recent"}
              className="flex-1 h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
            >
              {Object.entries(SORT_OPTIONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 px-4 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
            >
              تصفية
            </button>
          </div>
        </form>
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="لا توجد مكاتب"
          description="لم يسجّل أي مكتب يطابق التصفية الحالية"
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                  <th className="px-3 py-3">المكتب</th>
                  <th className="px-3 py-3">المالك</th>
                  <th className="px-3 py-3">المدينة</th>
                  <th className="px-3 py-3">الباقة</th>
                  <th className="px-3 py-3">الحالة</th>
                  <th className="px-3 py-3 text-center">مستخدمون</th>
                  <th className="px-3 py-3 text-center">قضايا</th>
                  <th className="px-3 py-3 text-center">التخزين</th>
                  <th className="px-3 py-3">آخر دخول</th>
                  <th className="px-3 py-3">نهاية الاشتراك</th>
                  <th className="px-3 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((t) => {
                  const storageMax = Number(t.maxStorage);
                  const storagePct =
                    storageMax > 0
                      ? Math.min(100, (t.storageUsed / storageMax) * 100)
                      : 0;
                  const usersPct = Math.min(
                    100,
                    (t._count.users / t.maxUsers) * 100,
                  );
                  const casesPct = Math.min(
                    100,
                    (t._count.cases / t.maxCases) * 100,
                  );

                  const lastLogin = t.owner?.lastLoginAt ?? t.lastActivityAt;
                  const daysIdle = daysSince(lastLogin);
                  const subEnd =
                    t.status === "TRIAL" ? t.trialEndsAt : t.subscriptionEnd;
                  const daysLeft = daysUntil(subEnd);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="font-medium text-slate-900 hover:text-amber-700"
                        >
                          {t.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {t.slug}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {t.owner ? (
                          <div className="space-y-0.5">
                            <p className="text-slate-900 text-xs font-medium">
                              {t.owner.name}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Mail className="size-3 shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {t.owner.email}
                              </span>
                            </p>
                            {t.owner.phone && (
                              <p className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Phone className="size-3 shrink-0" />
                                {t.owner.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{t.city}</td>
                      <td className="px-3 py-3">
                        <Badge className="bg-slate-100 text-slate-700">
                          {PLANS[t.plan]?.name ?? t.plan}
                        </Badge>
                        <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                          {formatCurrency(Number(t.monthlyPrice))}/شهر
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <Badge className={`${statusColors[t.status]} ring-1`}>
                            {TENANT_STATUS[t.status]}
                          </Badge>
                          {t.status === "TRIAL" &&
                            (daysLeft !== null && daysLeft < 0 ? (
                              <Badge className="bg-red-100 text-red-800 ring-1 ring-red-300 text-[10px]">
                                انتهت التجربة
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 ring-1 ring-amber-300 text-[10px]">
                                تجريبي
                              </Badge>
                            ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <UsageBar
                          used={t._count.users}
                          max={t.maxUsers}
                          pct={usersPct}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <UsageBar
                          used={t._count.cases}
                          max={t.maxCases}
                          pct={casesPct}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-700 tabular-nums whitespace-nowrap">
                            {formatFileSize(t.storageUsed)} /{" "}
                            {formatFileSize(storageMax)}
                          </p>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                storagePct >= 90
                                  ? "bg-red-500"
                                  : storagePct >= 70
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${storagePct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {lastLogin ? (
                          <div
                            className={
                              daysIdle !== null && daysIdle > 7
                                ? "text-red-600"
                                : "text-slate-700"
                            }
                          >
                            <p className="text-xs flex items-center gap-1">
                              {daysIdle !== null && daysIdle > 7 && (
                                <AlertTriangle className="size-3" />
                              )}
                              {formatRelativeTime(lastLogin)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <AlertTriangle className="size-3" />
                            لم يدخل
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {subEnd ? (
                          <div
                            className={
                              daysLeft !== null && daysLeft < 30
                                ? daysLeft < 7
                                  ? "text-red-600"
                                  : "text-amber-700"
                                : "text-slate-700"
                            }
                          >
                            <p className="text-xs flex items-center gap-1">
                              {daysLeft !== null && daysLeft < 30 && (
                                <AlertTriangle className="size-3" />
                              )}
                              {formatDate(subEnd)}
                            </p>
                            {daysLeft !== null && (
                              <p className="text-[11px] tabular-nums">
                                {daysLeft >= 0
                                  ? `${daysLeft} يوم متبقي`
                                  : `منتهي ${-daysLeft} يوم`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <TenantRowActions
                          tenantId={t.id}
                          status={t.status}
                          trialExpired={
                            t.status === "TRIAL" &&
                            daysLeft !== null &&
                            daysLeft < 0
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {result.totalPages > 1 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              params={params}
            />
          )}
        </Card>
      )}
    </div>
  );
}

function UsageBar({
  used,
  max,
  pct,
}: {
  used: number;
  max: number;
  pct: number;
}) {
  return (
    <div className="space-y-1 mx-auto max-w-[80px]">
      <p className="text-xs tabular-nums whitespace-nowrap">
        {used} / {max}
      </p>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            pct >= 90
              ? "bg-red-500"
              : pct >= 70
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  params,
}: {
  page: number;
  totalPages: number;
  total: number;
  params: Record<string, string | undefined>;
}) {
  const baseParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && k !== "page") baseParams.set(k, v);
  }
  const linkFor = (p: number) => {
    const sp = new URLSearchParams(baseParams);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  };
  return (
    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
      <p>
        صفحة {page} من {totalPages} · إجمالي {total} مكتب
      </p>
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link
            href={linkFor(page - 1)}
            className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            السابقة
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={linkFor(page + 1)}
            className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            التالية
          </Link>
        )}
      </div>
    </div>
  );
}
