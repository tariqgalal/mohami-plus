import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import { markAllAsRead } from "@/services/notification-service";

// PATCH /api/notifications/read-all — تعليم كل الإشعارات كمقروءة
export async function PATCH() {
  try {
    const user = await getCurrentUser();
    const tenantId = await getTenantId();
    const result = await markAllAsRead(user.id, tenantId);
    return apiSuccess({ updated: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
