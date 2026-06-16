import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId, getCurrentUser } from "@/lib/tenant";
import {
  createCaseSchema,
  caseFiltersSchema,
} from "@/lib/validations/case";
import { createCase, listCases } from "@/services/case-service";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = caseFiltersSchema.parse(params);
    const result = await listCases(tenantId, filters);
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
    const data = createCaseSchema.parse(body);
    const created = await createCase(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
