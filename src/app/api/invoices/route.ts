import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import {
  createInvoiceSchema,
  invoiceFiltersSchema,
} from "@/lib/validations/invoice";
import { createInvoice, listInvoices } from "@/services/invoice-service";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const filters = invoiceFiltersSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    const result = await listInvoices(tenantId, filters);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await getCurrentUser();
    const body = await req.json();
    const data = createInvoiceSchema.parse(body);
    const created = await createInvoice(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("غير موجود")) {
      return apiError(error.message, 404);
    }
    return handleApiError(error);
  }
}
