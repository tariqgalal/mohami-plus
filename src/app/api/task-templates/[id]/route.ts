import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateTaskTemplateSchema } from "@/lib/validations/task";
import {
  updateTaskTemplate,
  deleteTaskTemplate,
} from "@/services/task-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    await requirePermission("TASK_TEMPLATE_MANAGE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateTaskTemplateSchema.parse(body);
    const updated = await updateTaskTemplate(tenantId, id, data);
    if (!updated) return apiError("الرد الجاهز غير موجود", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    await requirePermission("TASK_TEMPLATE_MANAGE");
    const { id } = await ctx.params;
    const deleted = await deleteTaskTemplate(tenantId, id);
    if (!deleted) return apiError("الرد الجاهز غير موجود", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
