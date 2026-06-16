import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor(message = "غير مصرح") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "ممنوع") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * يرجع tenantId من الجلسة الحالية. يرمي خطأ إذا المستخدم غير مسجل دخول
 * أو ما عنده tenant (مثل Super Admin اللي يحاول يدخل API خاص بمكتب).
 */
export async function getTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (!session.user.tenantId) {
    throw new ForbiddenError("هذا المستخدم غير مرتبط بمكتب");
  }
  return session.user.tenantId;
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session.user;
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    throw new ForbiddenError("صلاحيات مدير المنصة مطلوبة");
  }
  return session.user;
}

export async function requireFirmAdmin() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.role !== "FIRM_ADMIN") {
    throw new ForbiddenError("صلاحيات مدير المكتب مطلوبة");
  }
  return session.user;
}
