import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import { recordMinutesSchema } from "@/lib/validations/meeting";
import { recordMeetingMinutes } from "@/services/meeting-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await getCurrentUser();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = recordMinutesSchema.parse(body);
    const updated = await recordMeetingMinutes(tenantId, user.id, id, data);
    if (!updated) return apiError("الاجتماع غير موجود", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
