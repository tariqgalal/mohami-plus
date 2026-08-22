import { NextRequest } from "next/server";
import { z } from "@/lib/zod";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/tenant";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/services/admin-service";

const bodySchema = z.object({
  values: z.record(z.string(), z.string()),
});

export async function GET() {
  try {
    await requireSuperAdmin();
    const settings = await getPlatformSettings();
    return apiSuccess(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await req.json();
    const { values } = bodySchema.parse(body);
    const updated = await updatePlatformSettings(values);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
