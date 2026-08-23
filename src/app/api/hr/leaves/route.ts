import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createEmployeeLeaveSchema,
  employeeLeaveFiltersSchema,
} from "@/lib/validations/employee-leave";
import {
  createEmployeeLeave,
  listEmployeeLeaves,
} from "@/services/employee-leave-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("HR_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = employeeLeaveFiltersSchema.parse(params);
    const result = await listEmployeeLeaves(tenantId, filters);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("HR_MANAGE");
    const body = await req.json();
    const data = createEmployeeLeaveSchema.parse(body);
    const created = await createEmployeeLeave(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
