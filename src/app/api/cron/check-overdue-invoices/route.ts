import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { scanAndNotifyOverdueInvoices } from "@/services/notification-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Vercel Cron always sets this header.
  if (req.headers.get("x-vercel-cron")) return true;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return apiError("غير مصرح", 401);
    const result = await scanAndNotifyOverdueInvoices();
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) return apiError("غير مصرح", 401);
    const result = await scanAndNotifyOverdueInvoices();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
