import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runBillingCron } from "@/services/billing-cron-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    if (!isCronAuthorized(req)) return apiError("غير مصرح", 401);
    const report = await runBillingCron(new Date());
    return apiSuccess(report);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isCronAuthorized(req)) return apiError("غير مصرح", 401);
    const report = await runBillingCron(new Date());
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return handleApiError(error);
  }
}
