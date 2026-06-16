import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import {
  listUserNotifications,
  getUnreadCount,
  markAllAsRead,
} from "@/services/notification-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const params = req.nextUrl.searchParams;
    const unreadOnly = params.get("unreadOnly") === "true";
    const limit = Math.min(100, Number(params.get("limit")) || 50);

    const [items, unreadCount] = await Promise.all([
      listUserNotifications(user.id, { unreadOnly, limit }),
      getUnreadCount(user.id),
    ]);

    return apiSuccess({ items, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/notifications -> mark all read
export async function PUT() {
  try {
    const user = await getCurrentUser();
    const result = await markAllAsRead(user.id);
    return apiSuccess({ updated: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
