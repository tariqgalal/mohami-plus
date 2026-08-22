import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { isCronAuthorized } from "@/lib/cron-auth";
import { scanAndNotifyOverdueInvoices } from "@/services/notification-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    if (!isCronAuthorized(req)) return apiError("غير مصرح", 401);
    const result = await scanAndNotifyOverdueInvoices();
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isCronAuthorized(req)) return apiError("غير مصرح", 401);
    const result = await scanAndNotifyOverdueInvoices();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
