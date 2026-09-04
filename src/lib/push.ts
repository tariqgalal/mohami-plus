import webPush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * إعداد web-push مرّة واحدة. لو مفاتيح VAPID غير مضبوطة في البيئة،
 * تُعطَّل إشعارات المتصفح بهدوء وتظل الإشعارات الداخلية تعمل عادي.
 */
let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn(
      "[push] مفاتيح VAPID غير مضبوطة — إشعارات المتصفح معطّلة (الإشعارات الداخلية تعمل عادي)",
    );
    configured = false;
    return configured;
  }

  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@mohamiplus.sa",
      publicKey,
      privateKey,
    );
    configured = true;
  } catch (error) {
    console.error("[push] فشل إعداد VAPID", error);
    configured = false;
  }
  return configured;
}

export function isPushConfigured(): boolean {
  return ensureConfigured();
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

/**
 * يرسل Push لكل أجهزة مستخدم معيّن. لا يرمي أخطاء أبداً —
 * فشل الـ push ليس سبباً لتعطيل العملية الأصلية.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });
    if (subscriptions.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number })?.statusCode;
          // 410 Gone / 404 Not Found → الاشتراك لم يعد صالحاً، نحذفه
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => undefined);
          } else {
            console.error("[push] فشل إرسال إشعار", statusCode, error);
          }
        }
      }),
    );
  } catch (error) {
    console.error("[push] خطأ عام في إرسال الإشعارات", error);
  }
}
