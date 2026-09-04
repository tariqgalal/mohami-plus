import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { normalizePreferences } from "@/services/notification-service";

const preferencesSchema = z.object({
  tasks: z.boolean(),
  sessions: z.boolean(),
  cases: z.boolean(),
  messages: z.boolean(),
  invoices: z.boolean(),
  leaves: z.boolean(),
});

// GET /api/notifications/preferences — تفضيلات إشعارات المستخدم الحالي
export async function GET() {
  try {
    const user = await getCurrentUser();
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationPreferences: true },
    });
    return apiSuccess(
      normalizePreferences(row?.notificationPreferences ?? null),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/notifications/preferences — حفظ التفضيلات
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const prefs = preferencesSchema.partial().parse(body);

    // ندمج فوق التفضيلات المحفوظة حتى لا يمسح تحديث جزئي بقية الخيارات
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationPreferences: true },
    });
    const merged = {
      ...normalizePreferences(current?.notificationPreferences ?? null),
      ...prefs,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { notificationPreferences: merged },
    });

    return apiSuccess(merged);
  } catch (error) {
    return handleApiError(error);
  }
}
