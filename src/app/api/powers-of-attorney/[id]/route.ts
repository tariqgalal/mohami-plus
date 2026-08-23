import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updatePowerOfAttorneySchema } from "@/lib/validations/power-of-attorney";
import {
  getPowerOfAttorney,
  updatePowerOfAttorney,
  deletePowerOfAttorney,
} from "@/services/power-of-attorney-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("POA_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getPowerOfAttorney(tenantId, id);
    if (!item) return apiError("الوكالة غير موجودة", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("POA_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updatePowerOfAttorneySchema.parse(body);
    const updated = await updatePowerOfAttorney(tenantId, user.id, id, data);
    if (!updated) return apiError("الوكالة غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("POA_DELETE");
    const { id } = await ctx.params;
    const deleted = await deletePowerOfAttorney(tenantId, user.id, id);
    if (!deleted) return apiError("الوكالة غير موجودة", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
