import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createTransactionSchema,
  transactionFiltersSchema,
} from "@/lib/validations/transaction";
import {
  createTransaction,
  listTransactions,
} from "@/services/transaction-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("TRANSACTION_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = transactionFiltersSchema.parse(params);
    const result = await listTransactions(tenantId, filters);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TRANSACTION_CREATE");
    const body = await req.json();
    const data = createTransactionSchema.parse(body);
    const created = await createTransaction(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
