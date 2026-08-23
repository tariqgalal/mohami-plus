import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateCorrespondenceSchema } from "@/lib/validations/correspondence";
import {
  getCorrespondence,
  updateCorrespondence,
  deleteCorrespondence,
} from "@/services/correspondence-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("CORRESPONDENCE_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getCorrespondence(tenantId, id);
    if (!item) return apiError("المراسلة غير موجودة", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("CORRESPONDENCE_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateCorrespondenceSchema.parse(body);
    const updated = await updateCorrespondence(tenantId, user.id, id, data);
    if (!updated) return apiError("المراسلة غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("CORRESPONDENCE_DELETE");
    const { id } = await ctx.params;
    const deleted = await deleteCorrespondence(tenantId, user.id, id);
    if (!deleted) return apiError("المراسلة غير موجودة", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
