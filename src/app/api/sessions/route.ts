import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createSessionSchema,
  sessionFiltersSchema,
} from "@/lib/validations/session";
import {
  createSession,
  listSessions,
} from "@/services/session-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("SESSION_READ");
    const tenantId = await getTenantId();
    const filters = sessionFiltersSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    const result = await listSessions(tenantId, filters);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("SESSION_CREATE");
    const body = await req.json();
    const data = createSessionSchema.parse(body);
    const created = await createSession(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
