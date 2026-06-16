import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Scale } from "lucide-react";
import { LoginForm } from "./login-form";
import { AuthShell } from "../_components/auth-shell";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="أدر مكتبك القانوني بكفاءة"
      subtitle="منصة متكاملة لإدارة القضايا والجلسات والعملاء في مكان واحد، صُمّمت خصيصاً للمكاتب القانونية في المملكة."
    >
      <div className="space-y-8">
        <div className="text-center lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="size-11 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white grid place-items-center shadow-md">
              <Scale className="size-5" />
            </span>
            <span className="text-xl font-bold text-slate-900">{APP_NAME}</span>
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">تسجيل الدخول</h1>
          <p className="text-sm text-slate-500">
            أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم.
          </p>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-slate-100" />}>
          <LoginForm />
        </Suspense>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex-1 h-px bg-slate-200" />
          <span>أو</span>
          <span className="flex-1 h-px bg-slate-200" />
        </div>

        <p className="text-center text-sm text-slate-600">
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            className="text-brand-700 font-semibold hover:text-brand-800 hover:underline"
          >
            سجّل مكتبك الآن
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
