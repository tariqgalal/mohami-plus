import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  updateTeamMemberSchema,
  resetPasswordSchema,
} from "@/lib/validations/team";
import {
  deleteTeamMember,
  getTeamMember,
  resetTeamMemberPassword,
  updateTeamMember,
} from "@/services/team-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requirePermission("TEAM_READ");
    const tenantId = await getTenantId();
    const { id } = await ctx.params;
    const item = await getTeamMember(tenantId, id);
    if (!item) return apiError("العضو غير موجود", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TEAM_MANAGE");
    const { id } = await ctx.params;
    const body = await req.json();

    // إعادة تعيين كلمة المرور — body فيه password فقط
    if (body && typeof body === "object" && "password" in body && !("name" in body) && !("role" in body)) {
      const { password } = resetPasswordSchema.parse(body);
      const r = await resetTeamMemberPassword(tenantId, user.id, id, password);
      if (!r) return apiError("العضو غير موجود", 404);
      return apiSuccess(r);
    }

    const data = updateTeamMemberSchema.parse(body);
    const updated = await updateTeamMember(tenantId, user.id, id, data);
    if (!updated) return apiError("العضو غير موجود", 404);
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TEAM_MANAGE");
    const { id } = await ctx.params;
    const deleted = await deleteTeamMember(tenantId, user.id, id);
    if (!deleted) return apiError("العضو غير موجود", 404);
    return apiSuccess({ id });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("حسابك") || error.message.includes("قضايا"))
    ) {
      return apiError(error.message, 409);
    }
    return handleApiError(error);
  }
}
