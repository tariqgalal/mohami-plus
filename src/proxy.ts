import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const path = nextUrl.pathname;

  const isAuthPage =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password");
  const isDashboard = path.startsWith("/dashboard");
  const isAdmin = path.startsWith("/admin");
  const isApi = path.startsWith("/api");

  // المستخدم مسجل دخول ويحاول يدخل صفحة auth → وجهه للداخل
  if (isAuthPage && isLoggedIn) {
    const target = session.user.isSuperAdmin ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(target, nextUrl));
  }

  // صفحات /dashboard تتطلب جلسة + tenant
  if (isDashboard) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
    if (!session.user.tenantId) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
  }

  // صفحات /admin تتطلب Super Admin
  if (isAdmin) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
    if (!session.user.isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // /api/admin/* يتطلب Super Admin
  if (isApi && path.startsWith("/api/admin")) {
    if (!isLoggedIn || !session.user.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "غير مصرح" },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * استثناء:
     * - api/auth (NextAuth routes)
     * - _next/static
     * - _next/image
     * - favicon, public files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|logo.svg|images).*)",
  ],
};
