import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId, getCurrentUser } from "@/lib/tenant";
import { updateCaseSchema } from "@/lib/validations/case";
import {
  deleteCase,
  getCase,
  updateCase,
} from "@/services/case-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getCase(tenantId, id);
    if (!item) return apiError("القضية غير موجودة", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await getCurrentUser();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateCaseSchema.parse(body);
    const updated = await updateCase(tenantId, user.id, id, data);
    if (!updated) return apiError("القضية غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await getCurrentUser();
    const { id } = await ctx.params;
    const deleted = await deleteCase(tenantId, user.id, id);
    if (!deleted) return apiError("القضية غير موجودة", 404);
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
