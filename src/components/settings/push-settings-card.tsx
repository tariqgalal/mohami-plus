"use client";

import { BellRing, BellOff, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";

interface PushSettingsCardProps {
  /** نسخة مختصرة تُعرض أعلى صفحة الإشعارات */
  compact?: boolean;
}

export function PushSettingsCard({ compact }: PushSettingsCardProps) {
  const { permission, isSubscribed, isSupported, isBusy, subscribe, unsubscribe } =
    usePushNotifications();

  // المتصفح لا يدعم Push (أو مفاتيح VAPID غير مضبوطة) — لا نعرض شيئاً
  if (!isSupported) return null;

  // في الوضع المختصر لا نعرض شيئاً إن كان المستخدم مشتركاً بالفعل
  if (compact && isSubscribed) return null;

  const blocked = permission === "denied";

  async function handleSubscribe() {
    const ok = await subscribe();
    if (ok) {
      toast.success("تم تفعيل إشعارات المتصفح");
    } else {
      toast.error(
        "لم يتم تفعيل الإشعارات — تأكد من السماح بها في إعدادات المتصفح",
      );
    }
  }

  async function handleUnsubscribe() {
    const ok = await unsubscribe();
    if (ok) toast.success("تم إيقاف إشعارات المتصفح على هذا الجهاز");
  }

  return (
    <Card
      className={cn(
        compact && "border-brand-200 bg-brand-50/40",
      )}
    >
      <CardContent className="p-5 flex items-start gap-4 flex-wrap">
        <div
          className={cn(
            "size-11 rounded-xl grid place-items-center shrink-0",
            isSubscribed
              ? "bg-emerald-50 text-emerald-600"
              : "bg-brand-50 text-brand-600",
          )}
        >
          {isSubscribed ? (
            <Check className="size-5" />
          ) : blocked ? (
            <BellOff className="size-5" />
          ) : (
            <BellRing className="size-5" />
          )}
        </div>

        <div className="flex-1 min-w-[220px]">
          <h3 className="font-semibold text-slate-900">
            إشعارات المتصفح
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {isSubscribed
              ? "الإشعارات مفعّلة على هذا الجهاز — ستصلك التنبيهات حتى لو كان الموقع مغلقاً."
              : blocked
                ? "الإشعارات محظورة من إعدادات المتصفح. اسمح بها لهذا الموقع ثم أعد المحاولة."
                : "فعّل الإشعارات لتصلك تنبيهات المهام والجلسات على جهازك حتى لو كان الموقع مغلقاً."}
          </p>
          {blocked && (
            <p className="text-xs text-slate-500 mt-2 inline-flex items-center gap-1.5">
              <Info className="size-3.5" />
              من شريط العنوان: أيقونة القفل → الإشعارات → السماح
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnsubscribe}
              loading={isBusy}
            >
              <BellOff className="size-4" />
              إيقاف
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubscribe}
              loading={isBusy}
              disabled={blocked}
            >
              <BellRing className="size-4" />
              تفعيل
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
