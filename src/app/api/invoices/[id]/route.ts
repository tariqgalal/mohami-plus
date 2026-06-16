import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import { updateInvoiceSchema } from "@/lib/validations/invoice";
import {
  deleteInvoice,
  getInvoice,
  updateInvoice,
} from "@/services/invoice-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getInvoice(tenantId, id);
    if (!item) return apiError("الفاتورة غير موجودة", 404);
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
    const data = updateInvoiceSchema.parse(body);
    const updated = await updateInvoice(tenantId, user.id, id, data);
    if (!updated) return apiError("الفاتورة غير موجودة", 404);
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
    const deleted = await deleteInvoice(tenantId, user.id, id);
    if (!deleted) return apiError("الفاتورة غير موجودة", 404);
    return apiSuccess({ id });
  } catch (error) {
    if (error instanceof Error && error.message.includes("لا يمكن")) {
      return apiError(error.message, 409);
    }
    return handleApiError(error);
  }
}
