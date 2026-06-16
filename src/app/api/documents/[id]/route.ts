import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import { updateDocumentSchema } from "@/lib/validations/document";
import {
  deleteDocument,
  getDocument,
  updateDocument,
} from "@/services/document-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getDocument(tenantId, id);
    if (!item) return apiError("المستند غير موجود", 404);
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
    const data = updateDocumentSchema.parse(body);
    const updated = await updateDocument(tenantId, user.id, id, data);
    if (!updated) return apiError("المستند غير موجود", 404);
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
    const deleted = await deleteDocument(tenantId, user.id, id);
    if (!deleted) return apiError("المستند غير موجود", 404);
    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
