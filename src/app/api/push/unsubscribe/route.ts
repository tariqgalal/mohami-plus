import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

const unsubscribeSchema = z.object({
  endpoint: z.string().url("عنوان الاشتراك غير صالح"),
});

// POST /api/push/unsubscribe — حذف اشتراك المتصفح
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { endpoint } = unsubscribeSchema.parse(body);

    // مقيّد بالمستخدم الحالي حتى لا يلغي أحد اشتراك غيره
    const result = await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: user.id },
    });

    return apiSuccess({ deleted: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
