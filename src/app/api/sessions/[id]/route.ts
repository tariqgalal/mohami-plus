import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import {
  recordResultSchema,
  updateSessionSchema,
} from "@/lib/validations/session";
import {
  deleteSession,
  getSession,
  recordSessionResult,
  updateSession,
} from "@/services/session-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getSession(tenantId, id);
    if (!item) return apiError("الجلسة غير موجودة", 404);
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

    // تسجيل نتيجة الجلسة
    if (body && typeof body === "object" && "result" in body && !("date" in body)) {
      const data = recordResultSchema.parse(body);
      const updated = await recordSessionResult(tenantId, user.id, id, data);
      if (!updated) return apiError("الجلسة غير موجودة", 404);
      return apiSuccess(updated);
    }

    const data = updateSessionSchema.parse(body);
    const updated = await updateSession(tenantId, user.id, id, data);
    if (!updated) return apiError("الجلسة غير موجودة", 404);
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
    const deleted = await deleteSession(tenantId, user.id, id);
    if (!deleted) return apiError("الجلسة غير موجودة", 404);
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
