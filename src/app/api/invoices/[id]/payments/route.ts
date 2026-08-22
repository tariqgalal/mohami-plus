import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { recordPaymentSchema } from "@/lib/validations/invoice";
import { recordPayment } from "@/services/invoice-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("INVOICE_MANAGE");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = recordPaymentSchema.parse(body);
    const result = await recordPayment(tenantId, user.id, id, data);
    if (!result) return apiError("الفاتورة غير موجودة", 404);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("يتجاوز")) {
      return apiError(error.message, 400);
    }
    return handleApiError(error);
  }
}
