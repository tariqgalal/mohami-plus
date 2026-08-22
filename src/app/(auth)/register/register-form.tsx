"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  registerFirmSchema,
  type RegisterFirmInput,
} from "@/lib/validations/auth";
import { SAUDI_CITIES, PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type PlanKey = keyof typeof PLANS;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as PlanKey | null;

  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFirmInput>({
    resolver: zodResolver(registerFirmSchema),
    defaultValues: {
      plan: planParam && PLANS[planParam] ? planParam : "PROFESSIONAL",
      acceptTerms: false,
    },
  });

  const selectedPlan = watch("plan");
  const password = watch("password");
  const adminEmail = watch("adminEmail");

  async function onSubmit(data: RegisterFirmInput) {
    setAuthError(null);
    const payload: RegisterFirmInput = {
      ...data,
      firmEmail: data.adminEmail,
      confirmPassword: data.password,
    };
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setAuthError(json.error || "حدث خطأ أثناء التسجيل");
      return;
    }

    const signinRes = await signIn("credentials", {
      email: data.adminEmail,
      password: data.password,
      redirect: false,
    });
    if (signinRes?.error) {
      router.push("/login");
      return;
    }
    // Hard navigation so the middleware re-reads the freshly-set session cookie
    // and the dashboard loads authenticated. A soft router.push here races with
    // the just-completed sign-in and can be swallowed.
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {authError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <IconInput
        id="firmName"
        label="اسم المكتب"
        icon={Building2}
        placeholder="مثال: مكتب الفهد للمحاماة"
        register={register("firmName")}
        error={errors.firmName?.message}
      />

      <IconInput
        id="adminName"
        label="الاسم الكامل"
        icon={User}
        placeholder="الاسم الكامل لمدير المكتب"
        register={register("adminName")}
        error={errors.adminName?.message}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <IconInput
          id="adminEmail"
          label="البريد الإلكتروني"
          type="email"
          inputMode="email"
          autoComplete="email"
          icon={Mail}
          placeholder="name@example.com"
          register={register("adminEmail")}
          error={errors.adminEmail?.message}
        />
        <IconInput
          id="firmPhone"
          label="رقم الجوال"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          icon={Phone}
          placeholder="05xxxxxxxx"
          register={register("firmPhone")}
          error={errors.firmPhone?.message}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <div className="relative">
            <Lock className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="8 أحرف على الأقل"
              {...register("password")}
              aria-invalid={!!errors.password}
              className="w-full h-12 ps-10 pe-10 rounded-xl border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-600"
              aria-label={
                showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
          {!errors.password && password && password.length > 0 && (
            <PasswordStrength password={password} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">المدينة</Label>
          <div className="relative">
            <MapPin className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-slate-400 pointer-events-none" />
            <select
              id="city"
              {...register("city")}
              aria-invalid={!!errors.city}
              defaultValue=""
              className="w-full h-12 ps-10 pe-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition appearance-none"
            >
              <option value="" disabled>
                — اختر المدينة —
              </option>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {errors.city && (
            <p className="text-xs text-red-600">{errors.city.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label>اختر الباقة</Label>
        <div className="grid sm:grid-cols-3 gap-2">
          {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(
            ([key, plan]) => {
              const active = selectedPlan === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() =>
                    setValue("plan", key, { shouldValidate: true })
                  }
                  className={cn(
                    "relative text-right p-3 rounded-xl border-2 transition-all",
                    active
                      ? "border-brand-600 bg-brand-50/70 shadow-sm shadow-brand-100"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {active && (
                    <span className="absolute top-2 end-2 size-5 rounded-full bg-brand-600 text-white grid place-items-center">
                      <Check className="size-3" />
                    </span>
                  )}
                  <p className="text-sm font-semibold text-slate-900">
                    {plan.name}
                  </p>
                  <p className="mt-1 tabular-nums">
                    <span className="text-lg font-bold text-brand-700">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500"> ر.س/شهر</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {plan.maxUsers === 999
                      ? "مستخدمون غير محدودين"
                      : `حتى ${plan.maxUsers} مستخدمين`}
                  </p>
                </button>
              );
            },
          )}
        </div>
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          ✓ تجربة مجانية 14 يوم بدون بطاقة ائتمان
        </p>
      </div>

      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox {...register("acceptTerms")} />
          <span className="text-slate-700 leading-relaxed">
            أوافق على{" "}
            <a href="#" className="text-brand-700 font-medium hover:underline">
              الشروط والأحكام
            </a>{" "}
            و{" "}
            <a href="#" className="text-brand-700 font-medium hover:underline">
              سياسة الخصوصية
            </a>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-l from-[#1e3a8a] to-[#2563eb] text-white text-sm font-semibold shadow-md shadow-brand-900/20 hover:shadow-lg hover:shadow-brand-900/30 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting && (
          <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {isSubmitting
          ? "جاري إنشاء الحساب..."
          : "إنشاء الحساب وبدء التجربة المجانية"}
      </button>

      {adminEmail && (
        <p className="text-[11px] text-slate-400 text-center">
          سيُستخدم {adminEmail} كبريد المكتب الرسمي أيضاً.
        </p>
      )}
    </form>
  );
}

function IconInput({
  id,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  register: registerProps,
  error,
}: {
  id: string;
  label: string;
  icon: typeof Building2;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  register: ReturnType<ReturnType<typeof useForm<RegisterFirmInput>>["register"]>;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-slate-400" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={!!error}
          {...registerProps}
          className="w-full h-12 ps-10 pe-3 rounded-xl border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8, label: "8 أحرف" },
    { ok: /[A-Za-z]/.test(password), label: "حرف" },
    { ok: /[0-9]/.test(password), label: "رقم" },
  ];
  const score = checks.filter((c) => c.ok).length;
  const color =
    score === 3
      ? "bg-emerald-500"
      : score === 2
        ? "bg-amber-500"
        : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${(score / 3) * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-500">
        {checks
          .filter((c) => !c.ok)
          .map((c) => c.label)
          .join(" + ") || "قوية"}
      </span>
    </div>
  );
}
