import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createServiceRequestSchema,
  serviceRequestFiltersSchema,
} from "@/lib/validations/client-service-request";
import {
  createServiceRequest,
  listServiceRequests,
  countServiceRequestsByStatus,
} from "@/services/client-service-request-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("SERVICE_REQUEST_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = serviceRequestFiltersSchema.parse(params);
    const [result, statusCounts] = await Promise.all([
      listServiceRequests(tenantId, filters),
      countServiceRequestsByStatus(tenantId),
    ]);
    return apiSuccess({ ...result, statusCounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("SERVICE_REQUEST_CREATE");
    const body = await req.json();
    const data = createServiceRequestSchema.parse(body);
    const created = await createServiceRequest(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
