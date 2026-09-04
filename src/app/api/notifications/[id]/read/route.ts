import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import { markAsRead } from "@/services/notification-service";

// PATCH /api/notifications/[id]/read — تعليم إشعار واحد كمقروء
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const result = await markAsRead(user.id, [id]);
    return apiSuccess({ updated: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
