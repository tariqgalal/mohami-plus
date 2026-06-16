import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/tenant";
import { listTenants, type TenantFiltersInput } from "@/services/admin-service";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const params = req.nextUrl.searchParams;
    const activity = params.get("activity") ?? undefined;
    const sort = params.get("sort") ?? undefined;
    const result = await listTenants({
      q: params.get("q") ?? undefined,
      status: params.get("status") ?? undefined,
      plan: params.get("plan") ?? undefined,
      city: params.get("city") ?? undefined,
      activity:
        activity === "active" || activity === "idle" || activity === "inactive"
          ? activity
          : undefined,
      sort: sort as TenantFiltersInput["sort"],
      page: Number(params.get("page") ?? 1),
      limit: Number(params.get("limit") ?? 20),
    });
    return apiSuccess({
      ...result,
      items: result.items.map((t) => ({
        ...t,
        maxStorage: Number(t.maxStorage),
        monthlyPrice: Number(t.monthlyPrice),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
