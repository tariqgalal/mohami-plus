import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/settings";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
        role: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const data = updateProfileSchema.parse(body);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        phone: data.phone ?? null,
        specialization: data.specialization ?? null,
        avatar: data.avatar !== undefined ? data.avatar || null : undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        specialization: true,
        avatar: true,
      },
    });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
