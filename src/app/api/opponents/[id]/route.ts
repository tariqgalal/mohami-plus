import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateOpponentSchema } from "@/lib/validations/opponent-record";
import {
  getOpponent,
  updateOpponent,
  deleteOpponent,
} from "@/services/opponent-record-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("OPPONENT_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getOpponent(tenantId, id);
    if (!item) return apiError("الخصم غير موجود", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("OPPONENT_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateOpponentSchema.parse(body);
    const updated = await updateOpponent(tenantId, user.id, id, data);
    if (!updated) return apiError("الخصم غير موجود", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("OPPONENT_DELETE");
    const { id } = await ctx.params;
    const deleted = await deleteOpponent(tenantId, user.id, id);
    if (!deleted) return apiError("الخصم غير موجود", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
