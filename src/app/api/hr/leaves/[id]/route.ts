import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateEmployeeLeaveSchema } from "@/lib/validations/employee-leave";
import {
  getEmployeeLeave,
  updateEmployeeLeave,
  deleteEmployeeLeave,
} from "@/services/employee-leave-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("HR_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getEmployeeLeave(tenantId, id);
    if (!item) return apiError("الإجازة غير موجودة", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("HR_MANAGE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateEmployeeLeaveSchema.parse(body);
    const updated = await updateEmployeeLeave(tenantId, user.id, id, data);
    if (!updated) return apiError("الإجازة غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("HR_MANAGE");
    const { id } = await ctx.params;
    const deleted = await deleteEmployeeLeave(tenantId, user.id, id);
    if (!deleted) return apiError("الإجازة غير موجودة", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
