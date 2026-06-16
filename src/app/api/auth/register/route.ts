import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Plan, TenantStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { registerFirmSchema } from "@/lib/validations/auth";
import { PLANS, TRIAL_DAYS } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerFirmSchema.parse(body);

    // 1. تحقق من الإيميل
    const existing = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });
    if (existing) {
      return apiError("هذا البريد مسجل مسبقاً", 409);
    }

    // 2. توليد slug فريد
    let baseSlug = slugify(data.firmName) || "firm";
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const plan = PLANS[data.plan];
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    // 3. إنشاء المكتب والمستخدم في transaction
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.firmName,
          slug,
          licenseNumber: data.licenseNumber || null,
          email: data.firmEmail,
          phone: data.firmPhone,
          city: data.city,
          plan: data.plan as Plan,
          status: TenantStatus.TRIAL,
          trialEndsAt,
          maxUsers: plan.maxUsers,
          maxCases: plan.maxCases,
          monthlyPrice: plan.price,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.adminEmail,
          password: hashedPassword,
          name: data.adminName,
          phone: data.firmPhone,
          role: UserRole.FIRM_ADMIN,
          tenantId: tenant.id,
          isActive: true,
        },
      });

      return { tenant, user };
    });

    return apiSuccess(
      {
        tenantId: result.tenant.id,
        email: result.user.email,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
