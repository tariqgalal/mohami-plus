import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateTaskSchema } from "@/lib/validations/task";
import { getTask, updateTask, deleteTask } from "@/services/task-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("TASK_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getTask(tenantId, id);
    if (!item) return apiError("المهمة غير موجودة", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TASK_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateTaskSchema.parse(body);
    const updated = await updateTask(tenantId, user.id, id, data);
    if (!updated) return apiError("المهمة غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TASK_DELETE");
    const { id } = await ctx.params;
    const deleted = await deleteTask(tenantId, user.id, id);
    if (!deleted) return apiError("المهمة غير موجودة", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
