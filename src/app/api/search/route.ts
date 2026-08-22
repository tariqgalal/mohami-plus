import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { globalSearch } from "@/services/search-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("CASE_READ");
    const tenantId = await getTenantId();
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const data = await globalSearch(tenantId, q, 5);
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
