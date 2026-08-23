import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createBorrowingSchema,
  borrowingFiltersSchema,
} from "@/lib/validations/borrowing";
import {
  createBorrowing,
  listBorrowings,
  countBorrowingsByStatus,
} from "@/services/borrowing-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("BORROWING_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = borrowingFiltersSchema.parse(params);
    const [result, statusCounts] = await Promise.all([
      listBorrowings(tenantId, filters),
      countBorrowingsByStatus(tenantId),
    ]);
    return apiSuccess({ ...result, statusCounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("BORROWING_CREATE");
    const body = await req.json();
    const data = createBorrowingSchema.parse(body);
    const created = await createBorrowing(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
