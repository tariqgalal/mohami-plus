import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createCorrespondenceSchema,
  correspondenceFiltersSchema,
} from "@/lib/validations/correspondence";
import {
  createCorrespondence,
  listCorrespondence,
  countCorrespondenceByDirection,
} from "@/services/correspondence-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("CORRESPONDENCE_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = correspondenceFiltersSchema.parse(params);

    const result = await listCorrespondence(tenantId, filters);
    const directionCounts = filters.type
      ? await countCorrespondenceByDirection(tenantId, filters.type)
      : {};

    return apiSuccess({ ...result, directionCounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("CORRESPONDENCE_CREATE");
    const body = await req.json();
    const data = createCorrespondenceSchema.parse(body);
    const created = await createCorrespondence(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
