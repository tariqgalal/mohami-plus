import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

const subscribeSchema = z.object({
  endpoint: z.string().url("عنوان الاشتراك غير صالح"),
  keys: z.object({
    p256dh: z.string().min(1, "مفتاح التشفير مطلوب"),
    auth: z.string().min(1, "مفتاح المصادقة مطلوب"),
  }),
  userAgent: z.string().max(500).optional(),
});

// POST /api/push/subscribe — حفظ اشتراك المتصفح في إشعارات Push
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const data = subscribeSchema.parse(body);

    // نفس الـ endpoint قد يعود من نفس المتصفح — نحدّثه بدل تكراره
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: user.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: data.userAgent ?? null,
      },
      update: {
        userId: user.id,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: data.userAgent ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return apiSuccess(subscription, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
