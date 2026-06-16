import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/settings";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const data = changePasswordSchema.parse(body);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!dbUser) return apiError("المستخدم غير موجود", 404);

    const valid = await bcrypt.compare(data.currentPassword, dbUser.password);
    if (!valid) return apiError("كلمة المرور الحالية غير صحيحة", 400);

    const hashed = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
