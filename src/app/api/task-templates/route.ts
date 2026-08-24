import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { createTaskTemplateSchema } from "@/lib/validations/task";
import {
  listTaskTemplates,
  createTaskTemplate,
} from "@/services/task-service";

export async function GET() {
  try {
    await requirePermission("TASK_READ");
    const tenantId = await getTenantId();
    const items = await listTaskTemplates(tenantId);
    return apiSuccess(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    await requirePermission("TASK_TEMPLATE_MANAGE");
    const body = await req.json();
    const data = createTaskTemplateSchema.parse(body);
    const created = await createTaskTemplate(tenantId, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
