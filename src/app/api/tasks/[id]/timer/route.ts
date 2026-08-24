import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { timerActionSchema } from "@/lib/validations/task";
import { toggleTaskTimer } from "@/services/task-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TASK_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const { action } = timerActionSchema.parse(body);
    const updated = await toggleTaskTimer(tenantId, user.id, id, action);
    if (!updated) return apiError("المهمة غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
