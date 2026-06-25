"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Save,
  RefreshCw,
  Settings2,
  Wallet,
  HardDrive,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import {
  PLANS,
  PLATFORM_SETTING_KEYS as K,
  TRIAL_DAYS,
  VAT_RATE,
} from "@/lib/constants";

const STORAGE_DEFAULTS = {
  BASIC: 5,
  PROFESSIONAL: 25,
  ENTERPRISE: 100,
};

export function PlatformSettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    trialDays: initial[K.TRIAL_DAYS] ?? String(TRIAL_DAYS),
    vatRate: initial[K.VAT_RATE] ?? String(VAT_RATE * 100),
    welcomeMessage:
      initial[K.WELCOME_MESSAGE] ??
      "مرحباً بك في محامي بلس! خلال 14 يوم تجريبية، استكشف كل ميزات المنصة.",
    basicPrice: initial[K.PLAN_BASIC_PRICE] ?? String(PLANS.BASIC.price),
    professionalPrice:
      initial[K.PLAN_PROFESSIONAL_PRICE] ?? String(PLANS.PROFESSIONAL.price),
    enterprisePrice:
      initial[K.PLAN_ENTERPRISE_PRICE] ?? String(PLANS.ENTERPRISE.price),
    basicStorage:
      initial[K.PLAN_BASIC_STORAGE_GB] ?? String(STORAGE_DEFAULTS.BASIC),
    professionalStorage:
      initial[K.PLAN_PROFESSIONAL_STORAGE_GB] ??
      String(STORAGE_DEFAULTS.PROFESSIONAL),
    enterpriseStorage:
      initial[K.PLAN_ENTERPRISE_STORAGE_GB] ??
      String(STORAGE_DEFAULTS.ENTERPRISE),
  });

  const mut = useMutation({
    mutationFn: async () => {
      const values: Record<string, string> = {
        [K.TRIAL_DAYS]: form.trialDays,
        [K.VAT_RATE]: form.vatRate,
        [K.WELCOME_MESSAGE]: form.welcomeMessage,
        [K.PLAN_BASIC_PRICE]: form.basicPrice,
        [K.PLAN_PROFESSIONAL_PRICE]: form.professionalPrice,
        [K.PLAN_ENTERPRISE_PRICE]: form.enterprisePrice,
        [K.PLAN_BASIC_STORAGE_GB]: form.basicStorage,
        [K.PLAN_PROFESSIONAL_STORAGE_GB]: form.professionalStorage,
        [K.PLAN_ENTERPRISE_STORAGE_GB]: form.enterpriseStorage,
      };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "فشل الحفظ");
      return json.data;
    },
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات");
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 pb-24">
      <SectionCard
        icon={Settings2}
        title="إعدادات عامة"
        subtitle="فترة التجربة، الضريبة، ورسالة الترحيب التي يراها المشتركون الجدد"
      >
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            id="trial"
            label="فترة التجربة المجانية"
            suffix="يوم"
            type="number"
            min={1}
            max={90}
            value={form.trialDays}
            onChange={(v) => setForm({ ...form, trialDays: v })}
          />
          <Field
            id="vat"
            label="ضريبة القيمة المضافة"
            suffix="%"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.vatRate}
            onChange={(v) => setForm({ ...form, vatRate: v })}
          />
        </div>
        <div className="space-y-2 mt-5">
          <Label htmlFor="welcome" className="text-sm font-semibold text-slate-700">
            رسالة الترحيب للمشتركين الجدد
          </Label>
          <textarea
            id="welcome"
            rows={3}
            value={form.welcomeMessage}
            onChange={(e) =>
              setForm({ ...form, welcomeMessage: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all"
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={Wallet}
        title="أسعار الباقات الشهرية"
        subtitle="السعر الذي يدفعه المكتب شهرياً لكل باقة (ريال سعودي)"
      >
        <div className="grid sm:grid-cols-3 gap-5">
          <PlanField
            tone="slate"
            label="أساسي"
            suffix="ر.س"
            value={form.basicPrice}
            onChange={(v) => setForm({ ...form, basicPrice: v })}
          />
          <PlanField
            tone="amber"
            label="احترافي"
            suffix="ر.س"
            value={form.professionalPrice}
            onChange={(v) => setForm({ ...form, professionalPrice: v })}
          />
          <PlanField
            tone="emerald"
            label="مؤسسي"
            suffix="ر.س"
            value={form.enterprisePrice}
            onChange={(v) => setForm({ ...form, enterprisePrice: v })}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={HardDrive}
        title="حدود التخزين لكل باقة"
        subtitle="مساحة المستندات المتاحة لكل مكتب حسب باقته (جيجابايت)"
      >
        <div className="grid sm:grid-cols-3 gap-5">
          <PlanField
            tone="slate"
            label="أساسي"
            suffix="GB"
            value={form.basicStorage}
            onChange={(v) => setForm({ ...form, basicStorage: v })}
          />
          <PlanField
            tone="amber"
            label="احترافي"
            suffix="GB"
            value={form.professionalStorage}
            onChange={(v) => setForm({ ...form, professionalStorage: v })}
          />
          <PlanField
            tone="emerald"
            label="مؤسسي"
            suffix="GB"
            value={form.enterpriseStorage}
            onChange={(v) => setForm({ ...form, enterpriseStorage: v })}
          />
        </div>
      </SectionCard>

      <Card className="border-amber-200/70 bg-gradient-to-bl from-amber-50 to-amber-50/30">
        <CardContent className="flex items-start gap-3 pt-6">
          <div className="size-10 rounded-lg bg-amber-100 text-amber-700 grid place-items-center shrink-0">
            <Info className="size-5" />
          </div>
          <div className="text-sm text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">ملاحظة هامة</p>
            <p>
              تعديل أسعار الباقات وحدود التخزين هنا يطبَّق على المكاتب الجديدة
              عند التسجيل فقط. المكاتب الحالية تحتفظ بأسعارها وحدودها الحالية
              إلى أن تتم ترقية باقاتها يدوياً من صفحة كل مكتب.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 inset-x-0 lg:right-64 z-30 bg-white/95 backdrop-blur border-t border-slate-200 px-6 py-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 hidden sm:block">
            تأكد من مراجعة الأسعار والحدود قبل الحفظ
          </p>
          <div className="flex items-center gap-3 ms-auto">
            <Button
              variant="outline"
              onClick={() => router.refresh()}
              disabled={mut.isPending}
              size="lg"
            >
              <RefreshCw className="size-4" /> إعادة تحميل
            </Button>
            <Button
              variant="admin"
              onClick={() => mut.mutate()}
              loading={mut.isPending}
              size="lg"
              className="px-8 shadow-gold ring-1 ring-amber-400/30"
            >
              {mut.isSuccess ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <Save className="size-5" />
              )}
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Settings2;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-bl from-slate-50/70 to-white">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-amber-100 text-amber-700 grid place-items-center shrink-0">
            <Icon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  suffix,
  value,
  onChange,
  ...rest
}: {
  id: string;
  label: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 text-base ps-4 pe-14 rounded-lg focus:ring-2 focus:ring-amber-500"
          {...rest}
        />
        {suffix && (
          <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function PlanField({
  label,
  suffix,
  value,
  onChange,
  tone,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  tone: "slate" | "amber" | "emerald";
}) {
  const toneRing = {
    slate: "ring-slate-200 from-slate-50",
    amber: "ring-amber-200 from-amber-50",
    emerald: "ring-emerald-200 from-emerald-50",
  }[tone];
  const toneText = {
    slate: "text-slate-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-xl ring-1 bg-gradient-to-b to-white p-4 transition-all hover:shadow-sm",
        toneRing,
      )}
    >
      <div
        className={cn("text-sm font-bold mb-3", toneText)}
      >
        {label}
      </div>
      <div className="relative">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 text-lg font-bold tabular-nums ps-4 pe-14 rounded-lg focus:ring-2 focus:ring-amber-500"
        />
        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
          {suffix}
        </span>
      </div>
    </div>
  );
}
