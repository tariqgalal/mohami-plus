import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { setCaseArchived } from "@/services/case-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("CASE_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const archived = body?.archived !== false; // افتراضياً أرشفة
    const updated = await setCaseArchived(tenantId, user.id, id, archived);
    if (!updated) return apiError("القضية غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
