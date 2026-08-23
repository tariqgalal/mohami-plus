import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createPowerOfAttorneySchema,
  powerOfAttorneyFiltersSchema,
} from "@/lib/validations/power-of-attorney";
import {
  createPowerOfAttorney,
  listPowersOfAttorney,
  countPowersOfAttorneyByStatus,
} from "@/services/power-of-attorney-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("POA_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = powerOfAttorneyFiltersSchema.parse(params);
    const [result, statusCounts] = await Promise.all([
      listPowersOfAttorney(tenantId, filters),
      countPowersOfAttorneyByStatus(tenantId),
    ]);
    return apiSuccess({ ...result, statusCounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("POA_CREATE");
    const body = await req.json();
    const data = createPowerOfAttorneySchema.parse(body);
    const created = await createPowerOfAttorney(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
