import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateDocumentSchema } from "@/lib/validations/document";
import {
  getDocument,
  updateDocument,
} from "@/services/document-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("DOCUMENT_READ");
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
    const user = await requirePermission("DOCUMENT_UPDATE");
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
    await ctx.params;
    return apiError("الحذف النهائي للمستندات معطّل حفاظاً على السجل", 403);
  } catch (error) {
    return handleApiError(error);
  }
}
