"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  Briefcase,
  Gavel,
  Receipt,
  FileText,
  UserCheck,
  Calendar as CalendarIcon,
  TrendingUp,
  Activity as ActivityIcon,
  Wallet,
  KeyRound,
  Pause,
  Play,
  Trash2,
  XCircle,
  Gift,
  Settings,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TenantActivityChart } from "@/components/admin/tenant-activity-chart";
import { TenantCasesChart } from "@/components/admin/tenant-cases-chart";
import { toast } from "@/store/toast-store";
import { PLANS, TENANT_STATUS, USER_ROLES } from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatRelativeTime,
} from "@/lib/format";

interface SerializedTenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  city: string;
  address: string | null;
  licenseNumber: string | null;
  logo: string | null;
  plan: keyof typeof PLANS;
  status: keyof typeof TENANT_STATUS;
  trialEndsAt: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  maxUsers: number;
  maxCases: number;
  maxStorage: number;
  monthlyPrice: number;
  lastActivityAt: string | null;
  createdAt: string;
  counts: {
    users: number;
    cases: number;
    clients: number;
    sessions: number;
    invoices: number;
    documents: number;
    meetings: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    providerRef: string | null;
    plan: string;
    period: string;
    createdAt: string;
  }>;
}

interface SerializedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  activitiesCount: number;
  createdCasesCount: number;
  sessionsCount: number;
}

interface SerializedActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string } | null;
}

interface SerializedUsage {
  storageUsed: number;
  activeUsersLast7Days: number;
  recentLogins: Array<{
    id: string;
    name: string;
    role: string;
    lastLoginAt: string | null;
  }>;
  dailyActivity: Array<{ date: string; count: number }>;
  monthlyCases: Array<{ month: string; count: number }>;
  lastActivity: { action: string; entity: string; createdAt: string } | null;
  avgDaily: number;
  activityLevel: "very_active" | "active" | "idle" | "inactive";
  totalRevenue: number;
  paymentsCount: number;
}

export interface SerializedRenewal {
  id: string;
  type: "EXTEND_TRIAL" | "GRANT_FREE_MONTHS" | "CONVERT_TO_PAID";
  days: number;
  reason: string | null;
  previousEnd: string | null;
  newEnd: string;
  createdAt: string;
  grantedBy: { id: string; name: string } | null;
}

const renewalTypeLabels: Record<SerializedRenewal["type"], string> = {
  EXTEND_TRIAL: "تمديد التجربة",
  GRANT_FREE_MONTHS: "منح أشهر مجانية",
  CONVERT_TO_PAID: "تحويل لاشتراك مدفوع",
};

const renewalTypeColors: Record<SerializedRenewal["type"], string> = {
  EXTEND_TRIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  GRANT_FREE_MONTHS: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CONVERT_TO_PAID: "bg-blue-50 text-blue-700 ring-blue-200",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DURATIONS = [7, 14, 30];
const GIFT_DURATIONS = [1, 3, 6];

const statusColors: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

const activityLevelLabels = {
  very_active: { label: "نشط جداً", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  active: { label: "نشط", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  idle: { label: "خامل", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  inactive: { label: "غير نشط", color: "bg-red-50 text-red-700 ring-red-200" },
} as const;

const actionLabels: Record<string, string> = {
  created: "أنشأ",
  updated: "حدّث",
  deleted: "حذف",
  viewed: "عرض",
};

const entityLabels: Record<string, string> = {
  case: "قضية",
  client: "عميل",
  session: "جلسة",
  invoice: "فاتورة",
  meeting: "اجتماع",
  document: "مستند",
  user: "مستخدم",
};

export function TenantDetailTabs({
  tenant,
  users,
  activities,
  usage,
  renewals,
}: {
  tenant: SerializedTenant;
  users: SerializedUser[];
  activities: SerializedActivity[];
  usage: SerializedUsage;
  renewals: SerializedRenewal[];
}) {
  return (
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">ملخص</TabsTrigger>
        <TabsTrigger value="users">المستخدمون ({users.length})</TabsTrigger>
        <TabsTrigger value="activity">النشاط والاستخدام</TabsTrigger>
        <TabsTrigger value="finance">المالية</TabsTrigger>
        <TabsTrigger value="renewals">
          سجل التجديدات ({renewals.length})
        </TabsTrigger>
        <TabsTrigger value="settings">إعدادات المكتب</TabsTrigger>
      </TabsList>

      <TabsContent value="summary">
        <SummaryTab tenant={tenant} usage={usage} />
      </TabsContent>
      <TabsContent value="users">
        <UsersTab users={users} />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityTab usage={usage} activities={activities} />
      </TabsContent>
      <TabsContent value="finance">
        <FinanceTab tenant={tenant} usage={usage} renewals={renewals} />
      </TabsContent>
      <TabsContent value="renewals">
        <RenewalsTab renewals={renewals} />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsTab tenant={tenant} />
      </TabsContent>
    </Tabs>
  );
}

// ============================
//        Tab 1: Summary
// ============================

function SummaryTab({
  tenant,
  usage,
}: {
  tenant: SerializedTenant;
  usage: SerializedUsage;
}) {
  const storagePct =
    tenant.maxStorage > 0
      ? Math.min(100, (usage.storageUsed / tenant.maxStorage) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">بيانات المكتب</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <Row icon={Mail} label="البريد" value={tenant.email} />
            <Row icon={Phone} label="الهاتف" value={tenant.phone ?? "—"} />
            <Row icon={MapPin} label="المدينة" value={tenant.city} />
            <Row
              icon={Building2}
              label="رقم الترخيص"
              value={tenant.licenseNumber ?? "—"}
            />
            {tenant.address && (
              <div className="sm:col-span-2 space-y-1 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">العنوان</p>
                <p className="text-slate-700">{tenant.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="size-4 text-slate-500" />
              الاشتراك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <KV label="الباقة" value={PLANS[tenant.plan]?.name ?? tenant.plan} />
            <KV
              label="السعر الشهري"
              value={formatCurrency(tenant.monthlyPrice)}
            />
            <KV label="تاريخ التسجيل" value={formatDate(tenant.createdAt)} />
            {tenant.trialEndsAt && (
              <KV
                label="نهاية التجربة"
                value={formatDate(tenant.trialEndsAt)}
                color="text-amber-700"
              />
            )}
            {tenant.subscriptionStart && (
              <KV
                label="بداية الاشتراك"
                value={formatDate(tenant.subscriptionStart)}
              />
            )}
            {tenant.subscriptionEnd && (
              <KV
                label="نهاية الاشتراك"
                value={formatDate(tenant.subscriptionEnd)}
                color="text-emerald-700"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="المستخدمون"
          value={`${tenant.counts.users} / ${tenant.maxUsers}`}
          pct={(tenant.counts.users / tenant.maxUsers) * 100}
          color="bg-violet-50 text-violet-700"
        />
        <StatCard
          icon={Briefcase}
          label="القضايا"
          value={`${tenant.counts.cases} / ${tenant.maxCases}`}
          pct={(tenant.counts.cases / tenant.maxCases) * 100}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          icon={Users}
          label="العملاء"
          value={String(tenant.counts.clients)}
          color="bg-cyan-50 text-cyan-700"
        />
        <StatCard
          icon={Gavel}
          label="الجلسات"
          value={String(tenant.counts.sessions)}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          icon={Receipt}
          label="الفواتير"
          value={String(tenant.counts.invoices)}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          icon={FileText}
          label={`المستندات (${formatFileSize(usage.storageUsed)})`}
          value={`${tenant.counts.documents} ملف`}
          pct={storagePct}
          color="bg-indigo-50 text-indigo-700"
        />
      </div>
    </div>
  );
}

// ============================
//        Tab 2: Users
// ============================

function UsersTab({ users }: { users: SerializedUser[] }) {
  const [sevenAgo] = useState(
    () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  );
  const activeUsers = users.filter(
    (u) => u.lastLoginAt && new Date(u.lastLoginAt) >= sevenAgo,
  );
  const inactiveUsers = users.filter(
    (u) => !u.lastLoginAt || new Date(u.lastLoginAt) < sevenAgo,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">إجمالي المستخدمين</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {users.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">نشطون (آخر 7 أيام)</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">
            {activeUsers.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">خاملون</p>
          <p className="text-2xl font-bold text-amber-700 tabular-nums">
            {inactiveUsers.length}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              لا يوجد مستخدمون
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                    <th className="pb-3">المستخدم</th>
                    <th className="pb-3">الدور</th>
                    <th className="pb-3">الهاتف</th>
                    <th className="pb-3">آخر دخول</th>
                    <th className="pb-3 text-center">العمليات</th>
                    <th className="pb-3 text-center">القضايا</th>
                    <th className="pb-3 text-center">الجلسات</th>
                    <th className="pb-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isActiveNow = Boolean(
                      u.lastLoginAt && new Date(u.lastLoginAt) >= sevenAgo,
                    );
                    return (
                      <tr key={u.id}>
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </td>
                        <td className="py-3">
                          <Badge className="bg-slate-100 text-slate-700">
                            {USER_ROLES[u.role as keyof typeof USER_ROLES] ??
                              u.role}
                          </Badge>
                        </td>
                        <td className="py-3 text-slate-700 text-xs">
                          {u.phone ?? "—"}
                        </td>
                        <td className="py-3 text-xs text-slate-700">
                          {u.lastLoginAt ? (
                            <>
                              <p>{formatRelativeTime(u.lastLoginAt)}</p>
                              <p className="text-slate-400 text-[11px]">
                                {formatDateTime(u.lastLoginAt)}
                              </p>
                            </>
                          ) : (
                            <span className="text-red-600">لم يدخل أبداً</span>
                          )}
                        </td>
                        <td className="py-3 text-center tabular-nums">
                          {u.activitiesCount}
                        </td>
                        <td className="py-3 text-center tabular-nums">
                          {u.createdCasesCount}
                        </td>
                        <td className="py-3 text-center tabular-nums">
                          {u.sessionsCount}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col gap-1 items-start">
                            {!u.isActive && (
                              <Badge className="bg-red-50 text-red-700 ring-1 ring-red-200">
                                معطّل
                              </Badge>
                            )}
                            {u.isActive &&
                              (isActiveNow ? (
                                <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                  نشط
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                                  خامل
                                </Badge>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================
//        Tab 3: Activity
// ============================

function ActivityTab({
  usage,
  activities,
}: {
  usage: SerializedUsage;
  activities: SerializedActivity[];
}) {
  const level = activityLevelLabels[usage.activityLevel];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">مؤشر النشاط</p>
          <Badge className={`${level.color} ring-1 mt-2`}>{level.label}</Badge>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">متوسط يومي (30 يوم)</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
            {usage.avgDaily.toFixed(1)} عملية
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">نشطون (آخر 7 أيام)</p>
          <p className="text-xl font-bold text-cyan-700 tabular-nums mt-1">
            {usage.activeUsersLast7Days}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">آخر نشاط</p>
          <p className="text-sm font-medium text-slate-900 mt-1">
            {usage.lastActivity
              ? formatRelativeTime(usage.lastActivity.createdAt)
              : "لا يوجد"}
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ActivityIcon className="size-4 text-amber-600" />
              النشاط اليومي (آخر 30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TenantActivityChart data={usage.dailyActivity} height={240} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="size-4 text-amber-600" />
              القضايا المنشأة شهرياً (آخر 12 شهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TenantCasesChart data={usage.monthlyCases} height={240} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر 20 عملية</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              لا يوجد نشاط مسجّل بعد
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-slate-100 text-slate-600 grid place-items-center text-xs font-semibold shrink-0">
                      {a.user?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 truncate">
                        <span className="font-medium">
                          {a.user?.name ?? "غير معروف"}
                        </span>
                        <span className="text-slate-500 mx-1">·</span>
                        <span className="text-slate-700">
                          {actionLabels[a.action] ?? a.action}
                        </span>{" "}
                        <span className="text-slate-500">
                          {entityLabels[a.entity] ?? a.entity}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {a.entityId}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {formatRelativeTime(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر تسجيلات الدخول</CardTitle>
        </CardHeader>
        <CardContent>
          {usage.recentLogins.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              لا يوجد تسجيلات دخول بعد
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {usage.recentLogins.map((l) => (
                <div
                  key={l.id}
                  className="py-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="size-4 text-emerald-600" />
                    <span className="text-slate-900 font-medium text-sm">
                      {l.name}
                    </span>
                    <Badge className="bg-slate-100 text-slate-700 text-xs">
                      {USER_ROLES[l.role as keyof typeof USER_ROLES] ?? l.role}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {l.lastLoginAt
                      ? formatRelativeTime(l.lastLoginAt)
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================
//        Tab 4: Finance
// ============================

function FinanceTab({
  tenant,
  usage,
  renewals,
}: {
  tenant: SerializedTenant;
  usage: SerializedUsage;
  renewals: SerializedRenewal[];
}) {
  const router = useRouter();
  const [extendOpen, setExtendOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [days, setDays] = useState(14);
  const [months, setMonths] = useState(1);
  const [reason, setReason] = useState("");
  const [convertPlan, setConvertPlan] = useState<keyof typeof PLANS>(
    tenant.plan,
  );
  const [newPlan, setNewPlan] = useState<keyof typeof PLANS>(tenant.plan);

  function resetReason() {
    setReason("");
  }

  const extendMut = useMutation({
    mutationFn: (d: number) =>
      callAction(tenant.id, "extend_trial", {
        days: d,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("تم تجديد التجربة");
      setExtendOpen(false);
      resetReason();
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const giftMut = useMutation({
    mutationFn: (m: number) =>
      callAction(tenant.id, "grant_free_months", {
        months: m,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("تم منح الأشهر المجانية");
      setGiftOpen(false);
      resetReason();
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const planMut = useMutation({
    mutationFn: (p: keyof typeof PLANS) =>
      callAction(tenant.id, "change_plan", { plan: p }),
    onSuccess: () => {
      toast.success("تم تغيير الباقة");
      setPlanOpen(false);
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const convertMut = useMutation({
    mutationFn: (p: keyof typeof PLANS) =>
      callAction(tenant.id, "convert_to_paid", {
        plan: p,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("تم تحويل المكتب لاشتراك مدفوع");
      setConvertOpen(false);
      resetReason();
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [nowMs] = useState(() => Date.now());
  const trialStart = tenant.createdAt;
  const trialEnd = tenant.trialEndsAt;
  const trialDaysLeft = trialEnd
    ? Math.ceil((new Date(trialEnd).getTime() - nowMs) / DAY_MS)
    : null;
  const trialExpired = trialDaysLeft !== null && trialDaysLeft < 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الإيراد</p>
              <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatCurrency(usage.totalRevenue)}
              </p>
            </div>
            <div className="size-12 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
              <Wallet className="size-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">الباقة الحالية</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {PLANS[tenant.plan]?.name ?? tenant.plan}
              </p>
              <p className="text-xs text-slate-500 tabular-nums">
                {formatCurrency(tenant.monthlyPrice)}/شهر
              </p>
            </div>
            <div className="size-12 rounded-lg bg-amber-50 text-amber-700 grid place-items-center">
              <TrendingUp className="size-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">عدد المدفوعات</p>
              <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
                {usage.paymentsCount}
              </p>
            </div>
            <div className="size-12 rounded-lg bg-blue-50 text-blue-700 grid place-items-center">
              <Receipt className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="size-4 text-amber-600" />
            إدارة الاشتراك والتجربة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">بداية التجربة</p>
              <p className="font-bold text-slate-900 mt-1">
                {formatDate(trialStart)}
              </p>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">نهاية التجربة</p>
              <p className="font-bold text-slate-900 mt-1">
                {trialEnd ? formatDate(trialEnd) : "—"}
              </p>
            </div>
            <div
              className={`p-3 rounded-md border ${
                trialDaysLeft === null
                  ? "bg-slate-50 border-slate-200"
                  : trialExpired
                    ? "bg-red-50 border-red-200"
                    : trialDaysLeft <= 3
                      ? "bg-amber-50 border-amber-200"
                      : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <p className="text-xs text-slate-500">الأيام المتبقية</p>
              <p
                className={`font-bold mt-1 tabular-nums ${
                  trialDaysLeft === null
                    ? "text-slate-900"
                    : trialExpired
                      ? "text-red-700"
                      : trialDaysLeft <= 3
                        ? "text-amber-700"
                        : "text-emerald-700"
                }`}
              >
                {trialDaysLeft === null
                  ? "—"
                  : trialExpired
                    ? `منتهي منذ ${-trialDaysLeft} يوم`
                    : `${trialDaysLeft} يوم`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setExtendOpen(true)}>
              <RefreshCw className="size-4" /> تجديد التجربة المجانية
            </Button>
            <Button variant="outline" onClick={() => setGiftOpen(true)}>
              <Gift className="size-4 text-emerald-600" /> منح فترة مجانية
            </Button>
            <Button variant="outline" onClick={() => setConvertOpen(true)}>
              <ArrowUpRight className="size-4 text-blue-600" /> تحويل لاشتراك
              مدفوع
            </Button>
            <Button variant="outline" onClick={() => setPlanOpen(true)}>
              <Settings className="size-4 text-amber-600" /> تغيير الباقة
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل التجديدات</CardTitle>
        </CardHeader>
        <CardContent>
          <RenewalList renewals={renewals.slice(0, 10)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          {tenant.payments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              لا توجد مدفوعات بعد
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                    <th className="pb-3">المبلغ</th>
                    <th className="pb-3">الباقة</th>
                    <th className="pb-3">المدة</th>
                    <th className="pb-3">المرجع</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenant.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 font-medium tabular-nums">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3">
                        <Badge className="bg-slate-100 text-slate-700">
                          {PLANS[p.plan as keyof typeof PLANS]?.name ?? p.plan}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-700">{p.period}</td>
                      <td className="py-3 text-xs text-slate-500 font-mono">
                        {p.providerRef ?? "—"}
                      </td>
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

      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogHeader>
          <DialogTitle>تجديد الفترة التجريبية</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="space-y-2">
            <Label>اختر المدة</Label>
            <div className="flex flex-wrap gap-2">
              {TRIAL_DURATIONS.map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={days === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDays(d)}
                >
                  {d} يوم
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ext-days">مدة مخصصة (يوم)</Label>
            <Input
              id="ext-days"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ext-reason">السبب (اختياري)</Label>
            <textarea
              id="ext-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: العميل طلب وقت إضافي"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setExtendOpen(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => extendMut.mutate(days)}
            loading={extendMut.isPending}
            disabled={!days || days < 1}
          >
            تأكيد التجديد
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
        <DialogHeader>
          <DialogTitle>منح فترة اشتراك مجانية</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="space-y-2">
            <Label>اختر المدة</Label>
            <div className="flex flex-wrap gap-2">
              {GIFT_DURATIONS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={months === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMonths(m)}
                >
                  {m} شهر
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gift-months">مدة مخصصة (أشهر)</Label>
            <Input
              id="gift-months"
              type="number"
              min={1}
              max={36}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gift-reason">السبب (اختياري)</Label>
            <textarea
              id="gift-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setGiftOpen(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => giftMut.mutate(months)}
            loading={giftMut.isPending}
            disabled={!months || months < 1}
          >
            منح
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogHeader>
          <DialogTitle>تحويل لاشتراك مدفوع</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <p className="text-xs text-slate-500">
            سيتم تفعيل الاشتراك المدفوع مباشرة وبدء الفترة بشهر واحد.
          </p>
          <div className="space-y-2">
            <Label htmlFor="convert-plan">اختر الباقة</Label>
            <select
              id="convert-plan"
              value={convertPlan}
              onChange={(e) =>
                setConvertPlan(e.target.value as keyof typeof PLANS)
              }
              className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
            >
              {Object.entries(PLANS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name} — {formatCurrency(v.price)}/شهر
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="convert-reason">السبب (اختياري)</Label>
            <textarea
              id="convert-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConvertOpen(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => convertMut.mutate(convertPlan)}
            loading={convertMut.isPending}
          >
            تأكيد التحويل
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogHeader>
          <DialogTitle>تغيير الباقة</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          <Label htmlFor="plan-select">اختر الباقة الجديدة</Label>
          <select
            id="plan-select"
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value as keyof typeof PLANS)}
            className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
          >
            {Object.entries(PLANS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name} — {formatCurrency(v.price)}/شهر
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            سيتم تحديث حدود المستخدمين والقضايا والتخزين تلقائياً
            وفقاً للباقة الجديدة.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPlanOpen(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => planMut.mutate(newPlan)}
            loading={planMut.isPending}
          >
            تأكيد التغيير
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ============================
//        Tab 5: Settings
// ============================

function SettingsTab({ tenant }: { tenant: SerializedTenant }) {
  const router = useRouter();
  const [pwdOpen, setPwdOpen] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [limits, setLimits] = useState({
    maxUsers: tenant.maxUsers,
    maxCases: tenant.maxCases,
    maxStorageGB: Math.round(tenant.maxStorage / (1024 * 1024 * 1024)),
  });

  const statusMut = useMutation({
    mutationFn: (status: string) =>
      callAction(tenant.id, "status", { status }),
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pwdMut = useMutation({
    mutationFn: (pwd: string) =>
      callAction(tenant.id, "reset_password", { newPassword: pwd }),
    onSuccess: () => {
      toast.success("تم إعادة تعيين كلمة المرور");
      setPwdOpen(false);
      setNewPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const limitsMut = useMutation({
    mutationFn: () => callAction(tenant.id, "update_limits", limits),
    onSuccess: () => {
      toast.success("تم تحديث حدود الباقة");
      setLimitsOpen(false);
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "فشل الحذف");
      return json.data;
    },
    onSuccess: () => {
      toast.success("تم حذف المكتب");
      router.push("/admin/tenants");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isActive = tenant.status === "ACTIVE" || tenant.status === "TRIAL";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="size-4 text-amber-600" />
            حالة الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-slate-700">
              الحالة الحالية:{" "}
              <Badge className={`${statusColors[tenant.status]} ring-1`}>
                {TENANT_STATUS[tenant.status]}
              </Badge>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {isActive
                ? "تعليق الحساب سيمنع جميع المستخدمين من تسجيل الدخول"
                : "تفعيل الحساب سيسمح بالدخول مرة أخرى"}
            </p>
          </div>
          <div className="flex gap-2">
            {isActive ? (
              <Button
                variant="outline"
                onClick={() => statusMut.mutate("SUSPENDED")}
                loading={statusMut.isPending}
              >
                <Pause className="size-4 text-red-600" /> تعليق
              </Button>
            ) : (
              <Button
                onClick={() => statusMut.mutate("ACTIVE")}
                loading={statusMut.isPending}
              >
                <Play className="size-4" /> تفعيل
              </Button>
            )}
            {tenant.status !== "CANCELLED" && (
              <Button
                variant="outline"
                onClick={() => statusMut.mutate("CANCELLED")}
                loading={statusMut.isPending}
              >
                <XCircle className="size-4 text-red-600" /> إلغاء الاشتراك
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="size-4 text-amber-600" />
            إعادة تعيين كلمة مرور المالك
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-slate-600 max-w-md">
            ستُعيّن كلمة مرور جديدة لمدير المكتب. أرسلها له بشكل آمن وأخبره
            بتغييرها بعد تسجيل الدخول.
          </p>
          <Button variant="outline" onClick={() => setPwdOpen(true)}>
            <RefreshCw className="size-4" /> إعادة تعيين
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">حدود الباقة (استثنائي)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">حد المستخدمين</p>
              <p className="font-bold text-slate-900 tabular-nums">
                {tenant.maxUsers}
              </p>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">حد القضايا</p>
              <p className="font-bold text-slate-900 tabular-nums">
                {tenant.maxCases}
              </p>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">حد التخزين</p>
              <p className="font-bold text-slate-900 tabular-nums">
                {formatFileSize(tenant.maxStorage)}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setLimitsOpen(true)}>
            <Settings className="size-4" /> تعديل الحدود
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-700 flex items-center gap-2">
            <Trash2 className="size-4" />
            منطقة الخطر
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-red-700 max-w-md">
            حذف المكتب سيُعطّل كل المستخدمين ويُعلّق الحساب. لا يُحذف
            البيانات نهائياً، لكن الوصول سيُمنع.
          </p>
          <Button variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4 text-red-600" /> حذف المكتب
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogHeader>
          <DialogTitle>كلمة مرور جديدة</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          <Label htmlFor="new-pwd">كلمة المرور (8 أحرف على الأقل)</Label>
          <Input
            id="new-pwd"
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="********"
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPwdOpen(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => pwdMut.mutate(newPassword)}
            loading={pwdMut.isPending}
            disabled={newPassword.length < 8}
          >
            تعيين
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}>
        <DialogHeader>
          <DialogTitle>تعديل حدود الباقة</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            ملاحظة: هذا تعديل استثنائي. تغيير الباقة يُعيد القيم لحدود
            الباقة الأصلية.
          </p>
          <div>
            <Label htmlFor="max-users">حد المستخدمين</Label>
            <Input
              id="max-users"
              type="number"
              min={1}
              max={9999}
              value={limits.maxUsers}
              onChange={(e) =>
                setLimits({ ...limits, maxUsers: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor="max-cases">حد القضايا</Label>
            <Input
              id="max-cases"
              type="number"
              min={1}
              max={99999}
              value={limits.maxCases}
              onChange={(e) =>
                setLimits({ ...limits, maxCases: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor="max-storage">حد التخزين (GB)</Label>
            <Input
              id="max-storage"
              type="number"
              min={1}
              max={10000}
              value={limits.maxStorageGB}
              onChange={(e) =>
                setLimits({ ...limits, maxStorageGB: Number(e.target.value) })
              }
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLimitsOpen(false)}>
            إلغاء
          </Button>
          <Button
            onClick={() => limitsMut.mutate()}
            loading={limitsMut.isPending}
          >
            حفظ
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogHeader>
          <DialogTitle>حذف المكتب</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          <p className="text-sm text-slate-700">
            سيتم تعطيل كل المستخدمين وتعليق الحساب نهائياً. لتأكيد الحذف، اكتب
            اسم المكتب:
          </p>
          <p className="font-bold text-slate-900 bg-slate-100 rounded px-2 py-1 inline-block">
            {tenant.name}
          </p>
          <Input
            value={confirmDeleteText}
            onChange={(e) => setConfirmDeleteText(e.target.value)}
            placeholder="اكتب اسم المكتب"
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMut.mutate()}
            loading={deleteMut.isPending}
            disabled={confirmDeleteText !== tenant.name}
          >
            <Trash2 className="size-4" /> حذف نهائي
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ============================
//        Tab 6: Renewals
// ============================

function RenewalsTab({ renewals }: { renewals: SerializedRenewal[] }) {
  const trialExtends = renewals.filter((r) => r.type === "EXTEND_TRIAL");
  const giftMonths = renewals.filter((r) => r.type === "GRANT_FREE_MONTHS");
  const conversions = renewals.filter((r) => r.type === "CONVERT_TO_PAID");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">تمديدات التجربة</p>
          <p className="text-2xl font-bold text-amber-700 tabular-nums">
            {trialExtends.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">منح أشهر مجانية</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">
            {giftMonths.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">تحويل لاشتراك مدفوع</p>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">
            {conversions.length}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل التجديدات الكامل</CardTitle>
        </CardHeader>
        <CardContent>
          <RenewalList renewals={renewals} />
        </CardContent>
      </Card>
    </div>
  );
}

function RenewalList({ renewals }: { renewals: SerializedRenewal[] }) {
  if (renewals.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        لا توجد تجديدات مسجّلة بعد
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200">
          <tr className="text-right text-xs font-medium text-slate-500 uppercase">
            <th className="pb-3">النوع</th>
            <th className="pb-3 text-center">المدة</th>
            <th className="pb-3">السبب</th>
            <th className="pb-3">جدد بواسطة</th>
            <th className="pb-3">نهاية جديدة</th>
            <th className="pb-3">التاريخ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {renewals.map((r) => (
            <tr key={r.id}>
              <td className="py-3">
                <Badge className={`${renewalTypeColors[r.type]} ring-1`}>
                  {renewalTypeLabels[r.type]}
                </Badge>
              </td>
              <td className="py-3 text-center tabular-nums text-slate-700">
                {r.type === "GRANT_FREE_MONTHS"
                  ? `${Math.round(r.days / 30)} شهر`
                  : `${r.days} يوم`}
              </td>
              <td className="py-3 text-slate-700 text-xs max-w-xs truncate">
                {r.reason ?? "—"}
              </td>
              <td className="py-3 text-slate-700 text-xs">
                {r.grantedBy?.name ?? "—"}
              </td>
              <td className="py-3 text-slate-700 text-xs">
                {formatDate(r.newEnd)}
              </td>
              <td className="py-3 text-slate-500 text-xs">
                <p>{formatDateTime(r.createdAt)}</p>
                <p className="text-[11px]">{formatRelativeTime(r.createdAt)}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================
//          Helpers
// ============================

async function callAction(
  tenantId: string,
  action: string,
  data: Record<string, unknown>,
) {
  const res = await fetch(`/api/admin/tenants/${tenantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "فشل الإجراء");
  return json.data;
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function KV({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${color ?? "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  pct,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  pct?: number;
  color: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`size-9 rounded-lg ${color} grid place-items-center`}>
          <Icon className="size-4" />
        </div>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
      {pct !== undefined && (
        <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              pct >= 90
                ? "bg-red-500"
                : pct >= 70
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
    </Card>
  );
}
