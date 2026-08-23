import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateTransactionSchema } from "@/lib/validations/transaction";
import {
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/services/transaction-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("TRANSACTION_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getTransaction(tenantId, id);
    if (!item) return apiError("المعاملة غير موجودة", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TRANSACTION_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateTransactionSchema.parse(body);
    const updated = await updateTransaction(tenantId, user.id, id, data);
    if (!updated) return apiError("المعاملة غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TRANSACTION_DELETE");
    const { id } = await ctx.params;
    const deleted = await deleteTransaction(tenantId, user.id, id);
    if (!deleted) return apiError("المعاملة غير موجودة", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
