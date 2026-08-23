import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateServiceRequestSchema } from "@/lib/validations/client-service-request";
import {
  getServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
} from "@/services/client-service-request-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("SERVICE_REQUEST_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getServiceRequest(tenantId, id);
    if (!item) return apiError("الطلب غير موجود", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("SERVICE_REQUEST_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateServiceRequestSchema.parse(body);
    const updated = await updateServiceRequest(tenantId, user.id, id, data);
    if (!updated) return apiError("الطلب غير موجود", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("SERVICE_REQUEST_DELETE");
    const { id } = await ctx.params;
    const deleted = await deleteServiceRequest(tenantId, user.id, id);
    if (!deleted) return apiError("الطلب غير موجود", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
