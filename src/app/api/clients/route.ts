import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  createClientSchema,
  clientFiltersSchema,
} from "@/lib/validations/client";
import { createClient, listClients } from "@/services/client-service";
import { prisma } from "@/lib/prisma";

// النمط البسيط (للاستخدام في dropdown القضايا) يبقى متاحاً عبر ?simple=1
export async function GET(req: NextRequest) {
  try {
    await requirePermission("CLIENT_READ");
    const tenantId = await getTenantId();
    const params = req.nextUrl.searchParams;

    if (params.get("simple") === "1") {
      const q = params.get("q") ?? "";
      const limit = Number(params.get("limit") ?? "50");
      const items = await prisma.client.findMany({
        where: {
          tenantId,
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { phone: { contains: q } },
                ],
              }
            : {}),
        },
        orderBy: { name: "asc" },
        take: limit,
        select: {
          id: true,
          name: true,
          clientType: true,
          phone: true,
          city: true,
        },
      });
      return apiSuccess({ items });
    }

    const filters = clientFiltersSchema.parse(
      Object.fromEntries(params),
    );
    const result = await listClients(tenantId, filters);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await requirePermission("CLIENT_CREATE");
    const body = await req.json();
    const data = createClientSchema.parse(body);
    const created = await createClient(tenantId, user.id, data);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
