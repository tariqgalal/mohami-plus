import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateConsultationSchema } from "@/lib/validations/consultation";
import {
  getConsultation,
  updateConsultation,
  deleteConsultation,
} from "@/services/consultation-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("CONSULTATION_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getConsultation(tenantId, id);
    if (!item) return apiError("الاستشارة غير موجودة", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("CONSULTATION_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateConsultationSchema.parse(body);
    const updated = await updateConsultation(tenantId, user.id, id, data);
    if (!updated) return apiError("الاستشارة غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("CONSULTATION_DELETE");
    const { id } = await ctx.params;
    const deleted = await deleteConsultation(tenantId, user.id, id);
    if (!deleted) return apiError("الاستشارة غير موجودة", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
