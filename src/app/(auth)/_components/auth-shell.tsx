import Link from "next/link";
import { Briefcase, Gavel, BarChart3, Scale } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const features = [
  {
    icon: Briefcase,
    title: "إدارة القضايا",
    body: "نظّم كل قضاياك وملفاتك في مكان واحد مع بحث وفلاتر سريعة.",
  },
  {
    icon: Gavel,
    title: "متابعة الجلسات",
    body: "جدول الجلسات القادمة وتلقَّ تذكيرات قبل الموعد بوقت كافٍ.",
  },
  {
    icon: BarChart3,
    title: "تقارير شاملة",
    body: "تقارير مالية وأداء المحامين تساعدك في اتخاذ قرارات أفضل.",
  },
];

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-gradient-to-br from-brand-50 via-white to-brand-50">
      <section className="hidden lg:flex relative flex-col justify-between p-12 text-white overflow-hidden bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]">
        <div
          aria-hidden
          className="absolute -top-24 -end-24 size-80 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -start-24 size-96 rounded-full bg-white/5 blur-3xl"
        />

        <Link
          href="/"
          className="relative inline-flex items-center gap-3 group"
        >
          <span className="size-14 rounded-2xl bg-white text-brand-700 grid place-items-center shadow-lg group-hover:scale-105 transition-transform">
            <Scale className="size-7" />
          </span>
          <span className="text-2xl font-bold">{APP_NAME}</span>
        </Link>

        <div className="relative space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-lg text-brand-100/90 leading-relaxed max-w-md">
                {subtitle}
              </p>
            )}
          </div>

          <ul className="space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="shrink-0 size-11 rounded-xl bg-white/15 backdrop-blur grid place-items-center ring-1 ring-white/20">
                  <f.icon className="size-5 text-white" />
                </span>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-brand-100/80 mt-0.5">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-100/70">
          © {new Date().getFullYear()} {APP_NAME} — جميع الحقوق محفوظة
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </section>
    </div>
  );
}
