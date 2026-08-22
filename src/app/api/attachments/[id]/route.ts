import { NextRequest } from "next/server";
import { apiError, handleApiError } from "@/lib/api-response";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    await ctx.params;
    return apiError("الحذف النهائي للمرفقات معطّل حفاظاً على السجل", 403);
  } catch (error) {
    return handleApiError(error);
  }
}
