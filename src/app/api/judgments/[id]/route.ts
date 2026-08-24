import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateJudgmentSchema } from "@/lib/validations/judgment";
import {
  getJudgment,
  updateJudgment,
  deleteJudgment,
} from "@/services/judgment-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("JUDGMENT_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getJudgment(tenantId, id);
    if (!item) return apiError("الحكم غير موجود", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("JUDGMENT_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateJudgmentSchema.parse(body);
    const updated = await updateJudgment(tenantId, user.id, id, data);
    if (!updated) return apiError("الحكم غير موجود", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("JUDGMENT_DELETE");
    const { id } = await ctx.params;
    const deleted = await deleteJudgment(tenantId, user.id, id);
    if (!deleted) return apiError("الحكم غير موجود", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
