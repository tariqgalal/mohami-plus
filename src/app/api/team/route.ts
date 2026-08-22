import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  createTeamMemberSchema,
  teamFiltersSchema,
} from "@/lib/validations/team";
import { createTeamMember, listTeam } from "@/services/team-service";

// النمط البسيط للاستخدام في dropdowns
export async function GET(req: NextRequest) {
  try {
    await requirePermission("TEAM_READ");
    const tenantId = await getTenantId();
    const params = req.nextUrl.searchParams;

    if (params.get("simple") === "1") {
      const items = await prisma.user.findMany({
        where: { tenantId, isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          specialization: true,
        },
      });
      return apiSuccess({ items });
    }

    const filters = teamFiltersSchema.parse(Object.fromEntries(params));
    const result = await listTeam(tenantId, filters);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("TEAM_MANAGE");
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxUsers: true },
    });

    const body = await req.json();
    const data = createTeamMemberSchema.parse(body);
    const created = await createTeamMember(
      tenantId,
      user.id,
      data,
      tenant?.maxUsers ?? 3,
    );
    return apiSuccess(created, 201);
  } catch (error) {
    if (error instanceof Error && (error.message.includes("الحد") || error.message.includes("مسجل"))) {
      return apiError(error.message, 409);
    }
    return handleApiError(error);
  }
}
