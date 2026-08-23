import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { updateBorrowingSchema } from "@/lib/validations/borrowing";
import {
  getBorrowing,
  updateBorrowing,
  deleteBorrowing,
} from "@/services/borrowing-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("BORROWING_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getBorrowing(tenantId, id);
    if (!item) return apiError("الاستعارة غير موجودة", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("BORROWING_UPDATE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateBorrowingSchema.parse(body);
    const updated = await updateBorrowing(tenantId, user.id, id, data);
    if (!updated) return apiError("الاستعارة غير موجودة", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("BORROWING_DELETE");
    const { id } = await ctx.params;
    const deleted = await deleteBorrowing(tenantId, user.id, id);
    if (!deleted) return apiError("الاستعارة غير موجودة", 404);
    return apiSuccess(deleted);
  } catch (error) {
    return handleApiError(error);
  }
}
