import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
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
    const user = await getCurrentUser();
    const body = await req.json();
    const data = createSessionSchema.parse(body);
    const created = await createSession(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
