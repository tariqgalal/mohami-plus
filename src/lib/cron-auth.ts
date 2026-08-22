import type { NextRequest } from "next/server";

/**
 * تفويض استدعاء الـ Cron endpoints.
 *
 * قواعد الحماية (defense in depth):
 * 1) لو CRON_SECRET مضبوط → نطلب Authorization: Bearer <CRON_SECRET> إجبارياً
 *    ولا نكتفي بوجود رأس x-vercel-cron وحده. Vercel Cron يضيف رأس الـ
 *    Authorization تلقائياً طالما المتغيّر موجود في بيئة المشروع، فالطلبات
 *    الحقيقية تمرّ، وأي طلب خارجي بدون السرّ يُرفض.
 * 2) لو CRON_SECRET غير مضبوط → نقبل طلبات Vercel Cron فقط (رأس x-vercel-cron
 *    الذي تجرّده Vercel من الطلبات الخارجية) حتى لا تتعطّل الجدولة، وفي بيئة
 *    التطوير نسمح بأي طلب لتسهيل الاختبار.
 *
 * الخلاصة: ضبط CRON_SECRET في بيئة الإنتاج (Vercel) هو الوضع الموصى به.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    return auth === `Bearer ${secret}`;
  }

  // لا يوجد سرّ مضبوط — نقبل طلبات Vercel Cron الحقيقية فقط
  if (req.headers.get("x-vercel-cron")) return true;

  // خارج ذلك: مسموح في التطوير فقط
  return process.env.NODE_ENV !== "production";
}
