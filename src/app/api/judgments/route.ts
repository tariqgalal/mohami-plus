import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createJudgmentSchema,
  judgmentFiltersSchema,
} from "@/lib/validations/judgment";
import {
  createJudgment,
  listJudgments,
  countJudgmentsByObjection,
} from "@/services/judgment-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("JUDGMENT_READ");
    const tenantId = await getTenantId();
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = judgmentFiltersSchema.parse(params);
    const [result, objectionCounts] = await Promise.all([
      listJudgments(tenantId, filters),
      countJudgmentsByObjection(tenantId),
    ]);
    return apiSuccess({ ...result, objectionCounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("JUDGMENT_CREATE");
    const body = await req.json();
    const data = createJudgmentSchema.parse(body);
    const created = await createJudgment(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
