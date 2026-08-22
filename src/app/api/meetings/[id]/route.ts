import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateMeetingSchema } from "@/lib/validations/meeting";
import {
  deleteMeeting,
  getMeeting,
  updateMeeting,
} from "@/services/meeting-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("MEETING_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getMeeting(tenantId, id);
    if (!item) return apiError("الاجتماع غير موجود", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("MEETING_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateMeetingSchema.parse(body);
    const updated = await updateMeeting(tenantId, user.id, id, data);
    if (!updated) return apiError("الاجتماع غير موجود", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("MEETING_UPDATE");
    const { id } = await ctx.params;
    const deleted = await deleteMeeting(tenantId, user.id, id);
    if (!deleted) return apiError("الاجتماع غير موجود", 404);
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
