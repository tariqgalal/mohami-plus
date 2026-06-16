import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser, getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { updateTenantSchema } from "@/lib/validations/settings";

export async function GET() {
  try {
    const tenantId = await getTenantId();
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        licenseNumber: true,
        email: true,
        phone: true,
        city: true,
        address: true,
        logo: true,
        plan: true,
        status: true,
        trialEndsAt: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        maxUsers: true,
        maxCases: true,
        monthlyPrice: true,
        createdAt: true,
        _count: {
          select: { users: true, cases: true, clients: true },
        },
      },
    });
    return apiSuccess(tenant);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    const user = await getCurrentUser();
    if (user.role !== "FIRM_ADMIN") {
      return apiError("صلاحيات مدير المكتب مطلوبة", 403);
    }
    const body = await req.json();
    const data = updateTenantSchema.parse(body);
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        licenseNumber: data.licenseNumber ?? null,
        email: data.email,
        phone: data.phone ?? null,
        city: data.city,
        address: data.address ?? null,
        logo: data.logo !== undefined ? data.logo || null : undefined,
      },
    });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
