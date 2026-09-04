"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PushSettingsCard } from "@/components/settings/push-settings-card";
import { toast } from "@/store/toast-store";

type Preferences = {
  tasks: boolean;
  sessions: boolean;
  cases: boolean;
  messages: boolean;
  invoices: boolean;
  leaves: boolean;
};

const DEFAULTS: Preferences = {
  tasks: true,
  sessions: true,
  cases: true,
  messages: true,
  invoices: true,
  leaves: true,
};

const FIELDS: { key: keyof Preferences; label: string; hint: string }[] = [
  {
    key: "tasks",
    label: "إشعارات المهام",
    hint: "التكليف بمهمة، اقتراب موعدها، تأخّرها، واكتمالها",
  },
  {
    key: "sessions",
    label: "تذكير الجلسات",
    hint: "جلسة جديدة، تذكير قبل يوم، وتذكير قبل ساعة",
  },
  {
    key: "cases",
    label: "تحديثات القضايا",
    hint: "التعيين على قضية وتغيّر حالتها",
  },
  {
    key: "messages",
    label: "الرسائل الداخلية",
    hint: "مراسلات الموظفين الواردة إليك",
  },
  {
    key: "invoices",
    label: "الفواتير المستحقة",
    hint: "إنشاء فاتورة جديدة واستحقاق/تأخّر السداد",
  },
  {
    key: "leaves",
    label: "طلبات الإجازة",
    hint: "طلبات جديدة (للمديرين) وقرارات القبول أو الرفض",
  },
];

export function NotificationPreferencesForm() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications/preferences", {
          cache: "no-store",
        });
        const json = await res.json();
        if (!cancelled && json.success) setPrefs({ ...DEFAULTS, ...json.data });
      } catch {
        // نُبقي القيم الافتراضية
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      toast.success("تم حفظ تفضيلات الإشعارات");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "تعذّر حفظ تفضيلات الإشعارات",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الإشعارات</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            اختر أنواع الإشعارات التي تريد استقبالها داخل النظام وعلى جهازك
          </p>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <div className="py-10 grid place-items-center text-slate-400">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <>
              {FIELDS.map((field) => (
                <label
                  key={field.key}
                  className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 cursor-pointer"
                >
                  <Checkbox
                    checked={prefs[field.key]}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        [field.key]: e.target.checked,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-900">
                      {field.label}
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {field.hint}
                    </span>
                  </span>
                </label>
              ))}

              <div className="pt-4">
                <Button onClick={save} loading={saving}>
                  <Save className="size-4" />
                  حفظ التفضيلات
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PushSettingsCard />
    </div>
  );
}
