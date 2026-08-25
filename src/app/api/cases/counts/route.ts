import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { countCasesByStatus } from "@/services/case-service";

export async function GET() {
  try {
    await requirePermission("CASE_READ");
    const tenantId = await getTenantId();
    const result = await countCasesByStatus(tenantId);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
