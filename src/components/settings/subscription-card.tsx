"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, TENANT_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

interface Tenant {
  plan: keyof typeof PLANS;
  status: keyof typeof TENANT_STATUS;
  trialEndsAt: string | null;
  subscriptionEnd: string | null;
  maxUsers: number;
  maxCases: number;
  monthlyPrice: string;
  _count: { users: number; cases: number; clients: number };
}

const statusColors: Record<string, string> = {
  TRIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function SubscriptionCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["tenant"],
    queryFn: async () => {
      const res = await fetch("/api/tenant");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data as Tenant;
    },
  });

  if (isLoading || !data) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        جاري التحميل...
      </Card>
    );
  }

  const plan = PLANS[data.plan];
  const usersPct = Math.min(
    100,
    (data._count.users / data.maxUsers) * 100,
  );
  const casesPct = Math.min(
    100,
    (data._count.cases / data.maxCases) * 100,
  );
  const endsAt = data.subscriptionEnd ?? data.trialEndsAt;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>الباقة الحالية</CardTitle>
            <Badge className={`${statusColors[data.status]} ring-1`}>
              {TENANT_STATUS[data.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-brand-700">
              {plan.name}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {plan.price} ر.س / شهرياً
            </p>
          </div>

          {endsAt && (
            <div className="flex items-center gap-2 text-sm">
              {data.status === "TRIAL" ? (
                <AlertCircle className="size-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-600" />
              )}
              <span className="text-slate-700">
                {data.status === "TRIAL"
                  ? `تنتهي الفترة التجريبية في ${formatDate(endsAt)}`
                  : `الاشتراك ساري حتى ${formatDate(endsAt)}`}
              </span>
            </div>
          )}

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">المستخدمون</span>
                <span className="font-medium tabular-nums">
                  {data._count.users} / {data.maxUsers}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${usersPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">القضايا</span>
                <span className="font-medium tabular-nums">
                  {data._count.cases} / {data.maxCases}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${casesPct}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">مميزات الباقة</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
