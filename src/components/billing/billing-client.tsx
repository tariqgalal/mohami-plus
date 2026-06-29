"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, Loader2, CreditCard, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanKey } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { MoyasarForm, type CheckoutInit } from "./moyasar-form";
import { InvoicesTable, type InvoiceRow } from "./invoices-table";

type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED";
type BillingType = "AUTO_RENEW" | "MANUAL";

interface SubscriptionData {
  subscription: {
    id: string;
    plan: PlanKey;
    status: SubscriptionStatus;
    billingType: BillingType;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    graceUntil: string | null;
    cardLastFour: string | null;
    cardBrand: string | null;
    canceledAt: string | null;
  };
  invoices: InvoiceRow[];
  tokenizationEnabled: boolean;
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIALING: "فترة تجريبية",
  ACTIVE: "نشط",
  PAST_DUE: "متعثّر",
  CANCELED: "ملغي",
  EXPIRED: "منتهي",
};

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  TRIALING: "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PAST_DUE: "bg-red-50 text-red-700 ring-red-200",
  CANCELED: "bg-slate-100 text-slate-700 ring-slate-200",
  EXPIRED: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function BillingClient() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [billingType, setBillingType] = useState<BillingType>("MANUAL");
  const [checkout, setCheckout] = useState<CheckoutInit | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["billing-subscription"],
    queryFn: async () => {
      const res = await fetch("/api/billing/subscription");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data as SubscriptionData;
    },
  });

  if (isLoading || !data) {
    return (
      <Card className="p-12 text-center text-sm text-slate-500">
        <Loader2 className="size-5 animate-spin inline-block ml-2" />
        جاري التحميل...
      </Card>
    );
  }

  const { subscription: sub, invoices, tokenizationEnabled } = data;
  const currentPlanDef = PLANS[sub.plan];
  const endsAt = sub.currentPeriodEnd ?? sub.trialEndsAt;

  async function startCheckout() {
    if (!selectedPlan) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, billingType }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "فشل بدء الدفع");
      }
      setCheckout(json.data as CheckoutInit);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* === الاشتراك الحالي === */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>الاشتراك الحالي</CardTitle>
            <Badge className={`${STATUS_STYLES[sub.status]} ring-1`}>
              {STATUS_LABELS[sub.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-3xl font-bold text-brand-700">
                {currentPlanDef.name}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {currentPlanDef.price} ر.س + ضريبة 15% / شهرياً
              </p>
            </div>
            {sub.billingType === "AUTO_RENEW" && sub.cardLastFour && (
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <CreditCard className="size-4" />
                <span>
                  {sub.cardBrand?.toUpperCase()} •••• {sub.cardLastFour}
                </span>
              </div>
            )}
          </div>

          {endsAt && (
            <div className="flex items-center gap-2 text-sm">
              {sub.status === "TRIALING" ? (
                <AlertCircle className="size-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-600" />
              )}
              <span className="text-slate-700">
                {sub.status === "TRIALING"
                  ? `تنتهي الفترة التجريبية في ${formatDate(endsAt)}`
                  : `الفترة الحالية تنتهي في ${formatDate(endsAt)}`}
              </span>
            </div>
          )}

          {sub.status === "PAST_DUE" && sub.graceUntil && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              فشل الخصم التلقائي. فترة السماح تنتهي في{" "}
              <strong>{formatDate(sub.graceUntil)}</strong>. سيتم تعليق الاشتراك
              بعدها.
            </div>
          )}
        </CardContent>
      </Card>

      {/* === اختيار باقة جديدة / ترقية === */}
      <Card>
        <CardHeader>
          <CardTitle>
            {sub.status === "ACTIVE" ? "ترقية / تغيير الباقة" : "اشترك الآن"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* الباقات */}
          <div className="grid sm:grid-cols-3 gap-4">
            {(Object.keys(PLANS) as PlanKey[]).map((key) => {
              const plan = PLANS[key];
              const isSelected = selectedPlan === key;
              const isCurrent = sub.plan === key && sub.status === "ACTIVE";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlan(key)}
                  className={`relative text-right rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  {isCurrent && (
                    <Badge className="absolute top-2 left-2 bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                      الحالية
                    </Badge>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">{plan.name}</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {plan.price}
                      <span className="text-sm text-slate-500 font-normal mr-1">
                        ر.س
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      + ضريبة 15% ={" "}
                      <span className="font-medium text-slate-600 tabular-nums">
                        {(plan.price * 1.15).toFixed(2)} ر.س
                      </span>{" "}
                      / شهرياً
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.slice(0, 4).map((f) => (
                      <li
                        key={f}
                        className="text-xs text-slate-600 flex items-start gap-1.5"
                      >
                        <CheckCircle2 className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* نوع الفوترة */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              طريقة الفوترة
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label
                className={`cursor-pointer rounded-lg border-2 p-3 flex items-start gap-3 ${
                  billingType === "MANUAL"
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="billingType"
                  className="mt-1"
                  checked={billingType === "MANUAL"}
                  onChange={() => setBillingType("MANUAL")}
                />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">يدوي شهرياً</p>
                  <p className="text-slate-500 mt-0.5">
                    تستلم فاتورة برابط دفع كل شهر عبر البريد والواتساب
                  </p>
                </div>
              </label>

              <label
                className={`rounded-lg border-2 p-3 flex items-start gap-3 ${
                  !tokenizationEnabled
                    ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50"
                    : billingType === "AUTO_RENEW"
                      ? "border-brand-500 bg-brand-50 cursor-pointer"
                      : "border-slate-200 bg-white cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name="billingType"
                  className="mt-1"
                  disabled={!tokenizationEnabled}
                  checked={billingType === "AUTO_RENEW"}
                  onChange={() => setBillingType("AUTO_RENEW")}
                />
                <div className="text-sm">
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    تجديد تلقائي{" "}
                    <RefreshCcw className="size-3.5 text-brand-600" />
                    {!tokenizationEnabled && (
                      <Badge className="bg-slate-100 text-slate-600 ring-1 ring-slate-200 text-[10px]">
                        قريباً
                      </Badge>
                    )}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    يُخصم تلقائياً من بطاقتك في بداية كل دورة
                  </p>
                </div>
              </label>
            </div>
          </div>

          {checkoutError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {checkoutError}
            </div>
          )}

          {!checkout && (
            <Button
              type="button"
              disabled={!selectedPlan || checkoutLoading}
              onClick={startCheckout}
              className="w-full sm:w-auto"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin ml-2" />
                  جاري التحضير...
                </>
              ) : (
                "متابعة الدفع"
              )}
            </Button>
          )}

          {checkout && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-2">
                إتمام الدفع
              </h3>
              <PriceBreakdown
                base={checkout.baseAmount}
                vat={checkout.vatAmount}
                total={checkout.amountHalalat}
              />
              <MoyasarForm
                init={checkout}
                onCancel={() => setCheckout(null)}
                onSuccess={() => {
                  refetch();
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* === الفواتير === */}
      <Card>
        <CardHeader>
          <CardTitle>الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesTable invoices={invoices} />
        </CardContent>
      </Card>
    </div>
  );
}

function PriceBreakdown({
  base,
  vat,
  total,
}: {
  base: number;
  vat: number;
  total: number;
}) {
  const sar = (h: number) => (h / 100).toFixed(2);
  return (
    <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
      <Row label="المبلغ قبل الضريبة" value={`${sar(base)} ر.س`} />
      <Row label="ضريبة القيمة المضافة (15%)" value={`${sar(vat)} ر.س`} />
      <div className="border-t border-slate-200 pt-1 mt-1">
        <Row label="الإجمالي" value={`${sar(total)} ر.س`} bold />
      </div>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold text-slate-900" : "text-slate-600"}>
        {label}
      </span>
      <span className={`tabular-nums ${bold ? "font-semibold text-slate-900" : "text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}
