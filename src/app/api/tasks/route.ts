import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { createTaskSchema, taskFiltersSchema } from "@/lib/validations/task";
import {
  createTask,
  listTasks,
  countTasksByStatus,
} from "@/services/task-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("TASK_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = taskFiltersSchema.parse(params);
    const [result, statusCounts] = await Promise.all([
      listTasks(tenantId, filters),
      countTasksByStatus(tenantId),
    ]);
    return apiSuccess({ ...result, statusCounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TASK_CREATE");
    const body = await req.json();
    const data = createTaskSchema.parse(body);
    const created = await createTask(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
