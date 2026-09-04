"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { toast } from "@/store/toast-store";

const DISMISS_KEY = "mp:push-banner-dismissed-at";
/** بعد التأجيل لا يظهر البانر مجدداً قبل أسبوع */
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function PushPermissionBanner() {
  const { permission, isSubscribed, isSupported, isBusy, subscribe } =
    usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      const at = raw ? Number(raw) : 0;
      setDismissed(!!at && Date.now() - at < SNOOZE_MS);
    } catch {
      setDismissed(false);
    }
  }, []);

  // نعرضه فقط لمتصفح يدعم Push ولم يُتخذ فيه قرار بعد
  if (!isSupported || isSubscribed || permission !== "default" || dismissed) {
    return null;
  }

  function snooze() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // تجاهل — على الأقل يختفي في هذه الجلسة
    }
    setDismissed(true);
  }

  async function enable() {
    const ok = await subscribe();
    if (ok) {
      toast.success("تم تفعيل إشعارات المتصفح");
    } else {
      toast.error("لم يتم تفعيل الإشعارات — يمكنك تفعيلها لاحقاً من الإعدادات");
      snooze();
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="size-9 rounded-lg bg-white text-brand-600 grid place-items-center shrink-0">
        <BellRing className="size-4.5" />
      </span>
      <p className="flex-1 min-w-[200px] text-sm text-slate-700">
        فعّل الإشعارات لتلقي التنبيهات على جهازك — الجلسات والمهام والرسائل حتى
        لو كان الموقع مغلقاً.
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={enable} loading={isBusy}>
          تفعيل
        </Button>
        <Button size="sm" variant="ghost" onClick={snooze}>
          لاحقاً
        </Button>
        <button
          onClick={snooze}
          aria-label="إخفاء"
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
