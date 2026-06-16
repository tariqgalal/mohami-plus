import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import { updateClientSchema } from "@/lib/validations/client";
import {
  deleteClient,
  getClient,
  updateClient,
} from "@/services/client-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getClient(tenantId, id);
    if (!item) return apiError("العميل غير موجود", 404);
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
    const data = updateClientSchema.parse(body);
    const updated = await updateClient(tenantId, user.id, id, data);
    if (!updated) return apiError("العميل غير موجود", 404);
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
    const deleted = await deleteClient(tenantId, user.id, id);
    if (!deleted) return apiError("العميل غير موجود", 404);
    return apiSuccess({ id });
  } catch (error) {
    if (error instanceof Error && error.message.includes("قضايا")) {
      return apiError(error.message, 409);
    }
    return handleApiError(error);
  }
}
