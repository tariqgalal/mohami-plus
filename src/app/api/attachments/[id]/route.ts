import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { deleteAttachment } from "@/services/attachment-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const removed = await deleteAttachment(tenantId, id);
    if (!removed) return apiError("المرفق غير موجود", 404);
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
