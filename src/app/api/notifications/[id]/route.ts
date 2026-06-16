import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import {
  markAsRead,
  deleteNotification,
} from "@/services/notification-service";

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    await markAsRead(user.id, [id]);
    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    await deleteNotification(user.id, id);
    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
