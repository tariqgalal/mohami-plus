import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Scale } from "lucide-react";
import { RegisterForm } from "./register-form";
import { AuthShell } from "../_components/auth-shell";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "تسجيل مكتب جديد",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="ابدأ تجربتك المجانية"
      subtitle="14 يوماً مجانية بدون بطاقة ائتمان. سجّل مكتبك واستكشف كل ميزات المنصة."
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
          <h1 className="text-3xl font-bold text-slate-900">
            سجّل مكتبك في {APP_NAME}
          </h1>
          <p className="text-sm text-slate-500">
            ابدأ تجربتك المجانية الآن واستمتع بـ 14 يوماً كاملة بدون أي رسوم.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded-md bg-slate-100" />
          }
        >
          <RegisterForm />
        </Suspense>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex-1 h-px bg-slate-200" />
          <span>أو</span>
          <span className="flex-1 h-px bg-slate-200" />
        </div>

        <p className="text-center text-sm text-slate-600">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="text-brand-700 font-semibold hover:text-brand-800 hover:underline"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
