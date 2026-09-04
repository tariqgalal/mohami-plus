import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import {
  listUserNotifications,
  countUserNotifications,
  getUnreadCount,
  markAllAsRead,
} from "@/services/notification-service";

// GET /api/notifications?unreadOnly=true&limit=20&page=1
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const tenantId = await getTenantId();

    const params = req.nextUrl.searchParams;
    const unreadOnly = params.get("unreadOnly") === "true";
    const limit = Math.min(100, Math.max(1, Number(params.get("limit")) || 50));
    const page = Math.max(1, Number(params.get("page")) || 1);

    const [items, total, unreadCount] = await Promise.all([
      listUserNotifications(user.id, tenantId, {
        unreadOnly,
        limit,
        skip: (page - 1) * limit,
      }),
      countUserNotifications(user.id, tenantId, { unreadOnly }),
      getUnreadCount(user.id, tenantId),
    ]);

    return apiSuccess({
      items,
      notifications: items,
      unreadCount,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/notifications — تعليم الكل كمقروء (متوافق مع الواجهة القديمة)
export async function PUT() {
  try {
    const user = await getCurrentUser();
    const tenantId = await getTenantId();
    const result = await markAllAsRead(user.id, tenantId);
    return apiSuccess({ updated: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
