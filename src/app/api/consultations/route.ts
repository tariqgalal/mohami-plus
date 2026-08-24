import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createConsultationSchema,
  consultationFiltersSchema,
} from "@/lib/validations/consultation";
import {
  createConsultation,
  listConsultations,
  countConsultationsByStatus,
} from "@/services/consultation-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("CONSULTATION_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = consultationFiltersSchema.parse(params);
    const [result, statusCounts] = await Promise.all([
      listConsultations(tenantId, filters),
      countConsultationsByStatus(tenantId),
    ]);
    return apiSuccess({ ...result, statusCounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("CONSULTATION_CREATE");
    const body = await req.json();
    const data = createConsultationSchema.parse(body);
    const created = await createConsultation(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
