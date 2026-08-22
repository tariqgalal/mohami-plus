import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createMeetingSchema,
  meetingFiltersSchema,
} from "@/lib/validations/meeting";
import { createMeeting, listMeetings } from "@/services/meeting-service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("MEETING_READ");
    const tenantId = await getTenantId();
    const filters = meetingFiltersSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    const result = await listMeetings(tenantId, filters);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("MEETING_CREATE");
    const body = await req.json();
    const data = createMeetingSchema.parse(body);
    const created = await createMeeting(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
