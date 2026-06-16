"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Save, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/store/toast-store";
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إعدادات عامة</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trial">فترة التجربة المجانية (بالأيام)</Label>
            <Input
              id="trial"
              type="number"
              min={1}
              max={90}
              value={form.trialDays}
              onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat">ضريبة القيمة المضافة (%)</Label>
            <Input
              id="vat"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.vatRate}
              onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="welcome">رسالة الترحيب للمشتركين الجدد</Label>
            <textarea
              id="welcome"
              rows={3}
              value={form.welcomeMessage}
              onChange={(e) =>
                setForm({ ...form, welcomeMessage: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">أسعار الباقات (ر.س/شهر)</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <PriceField
            label="أساسي"
            value={form.basicPrice}
            onChange={(v) => setForm({ ...form, basicPrice: v })}
          />
          <PriceField
            label="احترافي"
            value={form.professionalPrice}
            onChange={(v) => setForm({ ...form, professionalPrice: v })}
          />
          <PriceField
            label="مؤسسي"
            value={form.enterprisePrice}
            onChange={(v) => setForm({ ...form, enterprisePrice: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">حدود التخزين لكل باقة (GB)</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <StorageField
            label="أساسي"
            value={form.basicStorage}
            onChange={(v) => setForm({ ...form, basicStorage: v })}
          />
          <StorageField
            label="احترافي"
            value={form.professionalStorage}
            onChange={(v) => setForm({ ...form, professionalStorage: v })}
          />
          <StorageField
            label="مؤسسي"
            value={form.enterpriseStorage}
            onChange={(v) => setForm({ ...form, enterpriseStorage: v })}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-slate-50 -mx-6 px-6 py-3 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={() => router.refresh()}
          disabled={mut.isPending}
        >
          <RefreshCw className="size-4" /> إعادة تحميل
        </Button>
        <Button onClick={() => mut.mutate()} loading={mut.isPending}>
          <Save className="size-4" /> حفظ الإعدادات
        </Button>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="text-sm text-amber-900 pt-6">
          <p className="font-medium mb-1">ملاحظة:</p>
          <p>
            تعديل أسعار الباقات وحدود التخزين هنا يطبَّق على المكاتب الجديدة
            عند التسجيل. المكاتب الحالية تحتفظ بأسعارها وحدودها الحالية إلى أن
            تتم ترقية باقاتها يدوياً من صفحة كل مكتب.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pe-12"
        />
        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          ر.س
        </span>
      </div>
    </div>
  );
}

function StorageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pe-10"
        />
        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          GB
        </span>
      </div>
    </div>
  );
}
