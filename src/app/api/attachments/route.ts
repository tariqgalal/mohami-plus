import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import {
  attachmentFilterSchema,
  createLinkAttachmentSchema,
} from "@/lib/validations/attachment";
import {
  createLinkAttachment,
  listAttachments,
} from "@/services/attachment-service";

const OWNER_KEYS = [
  "caseId",
  "clientId",
  "invoiceId",
  "sessionId",
  "meetingId",
] as const;

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const params: Record<string, string | undefined> = {};
    for (const k of OWNER_KEYS) {
      const v = req.nextUrl.searchParams.get(k);
      if (v) params[k] = v;
    }
    const filter = attachmentFilterSchema.parse(params);
    const items = await listAttachments(tenantId, filter);
    return apiSuccess(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await getCurrentUser();
    const body = await req.json();
    const data = createLinkAttachmentSchema.parse(body);
    const created = await createLinkAttachment(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
