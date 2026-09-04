import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import { getUnreadCount } from "@/services/notification-service";

// GET /api/notifications/unread-count — عدد الإشعارات غير المقروءة (للـ polling)
export async function GET() {
  try {
    const user = await getCurrentUser();
    const tenantId = await getTenantId();
    const count = await getUnreadCount(user.id, tenantId);
    return apiSuccess({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
