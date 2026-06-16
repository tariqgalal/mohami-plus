import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_DESCRIPTION, PLANS } from "@/lib/constants";
import {
  Briefcase,
  Gavel,
  Wallet,
  Users,
  Check,
  BarChart3,
  Calendar,
  Shield,
  Headphones,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  Star,
  Quote,
  Globe,
  MessageCircle,
  Share2,
  Send,
} from "lucide-react";

const FEATURES = [
  {
    icon: Briefcase,
    title: "إدارة القضايا",
    desc: "تتبع جميع القضايا بتفاصيلها الكاملة، المستندات، الخصوم، والمحامين المسؤولين",
    color: "bg-blue-50 text-blue-600 ring-blue-100",
  },
  {
    icon: Calendar,
    title: "جدول الجلسات",
    desc: "تنظيم مواعيد الجلسات مع تذكيرات تلقائية قبل موعد الجلسة بأيام أو ساعات",
    color: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  {
    icon: Users,
    title: "إدارة العملاء",
    desc: "ملفات شاملة لكل عميل مع تاريخ التعاملات، الفواتير، وكل قضاياه السابقة والحالية",
    color: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    icon: Gavel,
    title: "إدارة الفريق",
    desc: "توزيع المهام بين المحامين، متابعة أدائهم، وتعيين صلاحيات حسب الدور",
    color: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    icon: Wallet,
    title: "المالية والفوترة",
    desc: "فواتير احترافية مع ضريبة القيمة المضافة 15%، متابعة المدفوعات والمتأخرات",
    color: "bg-rose-50 text-rose-600 ring-rose-100",
  },
  {
    icon: BarChart3,
    title: "تقارير وتحليلات",
    desc: "تقارير مفصلة عن أداء المكتب، الإيرادات، نسب الفوز، ومعدل إغلاق القضايا",
    color: "bg-cyan-50 text-cyan-600 ring-cyan-100",
  },
];

const WHY_US = [
  {
    icon: MapPin,
    title: "مصمم للسوق السعودي",
    desc: "نظام عربي 100% مبني على فهم عميق لاحتياجات مكاتب المحاماة السعودية",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: Gavel,
    title: "متوافق مع نظام ناجز",
    desc: "ربط مباشر بأرقام القضايا في ناجز وتنظيم البيانات حسب المحاكم السعودية",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Headphones,
    title: "دعم فني سعودي",
    desc: "فريق دعم فني محلي يفهم احتياجاتك ويستجيب بسرعة بلغتك",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: Shield,
    title: "أمان وخصوصية عالية",
    desc: "بياناتك مشفّرة ومعزولة تماماً عن المكاتب الأخرى مع نسخ احتياطية يومية",
    color: "bg-amber-100 text-amber-700",
  },
];

const STATS = [
  { value: "+500", label: "مكتب محاماة" },
  { value: "+10,000", label: "قضية مُدارة" },
  { value: "98%", label: "رضا العملاء" },
  { value: "24/7", label: "دعم فني" },
];

const TESTIMONIALS = [
  {
    name: "أ. عبدالله الحربي",
    role: "مدير مكتب الحربي للمحاماة — الرياض",
    text: "نظام محامي بلس وفّر علينا ساعات يومياً في تنظيم القضايا وتتبع الجلسات. التذكيرات التلقائية حلّت مشكلة نسيان المواعيد.",
  },
  {
    name: "أ. منى الشمري",
    role: "محامية شريكة — جدة",
    text: "أفضل ميزة هي التقارير المالية. صرنا نتابع الفواتير المستحقة بسهولة وزادت تحصيلاتنا الشهرية بنسبة كبيرة.",
  },
  {
    name: "أ. سلطان القحطاني",
    role: "مدير عام مكتب القحطاني — الدمام",
    text: "واجهة عربية فاخرة، سرعة استجابة الدعم ممتازة، وكل التحديثات تأتي بناءً على ملاحظات المكاتب فعلاً.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white animate-fade-in-page">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="container-app h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="size-9 rounded-lg bg-brand-gradient grid place-items-center text-white font-bold text-lg shadow-md shadow-brand-600/30">
              م
            </span>
            <span className="text-lg font-bold text-slate-900">{APP_NAME}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-slate-600 hover:text-brand-600 transition-colors">
              المميزات
            </a>
            <a href="#why-us" className="text-slate-600 hover:text-brand-600 transition-colors">
              لماذا نحن
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-brand-600 transition-colors">
              التسعير
            </a>
            <a href="#testimonials" className="text-slate-600 hover:text-brand-600 transition-colors">
              آراء العملاء
            </a>
            <a href="#contact" className="text-slate-600 hover:text-brand-600 transition-colors">
              تواصل معنا
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold px-5 h-10 shadow-md shadow-blue-600/20"
              >
                ابدأ مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 size-96 rounded-full bg-brand-200/40 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 size-96 rounded-full bg-violet-200/30 blur-3xl pointer-events-none"
        />
        <div className="container-app relative py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur text-brand-700 border border-brand-200 px-4 py-1.5 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="size-3.5" />
            نظام ERP متكامل لمكاتب المحاماة السعودية
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
            أدر مكتبك بكفاءة <br className="hidden sm:block" />
            مع <span className="text-gradient-brand">{APP_NAME}</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {APP_DESCRIPTION}. قضايا، جلسات، عملاء، مالية، ومستندات — كل ذلك في
            منصة واحدة آمنة بالعربية.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-bold text-base py-4 px-8 h-auto shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
              >
                ابدأ تجربتك المجانية 14 يوم
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 bg-white text-slate-800 hover:text-[#2563eb] hover:border-[#2563eb] hover:bg-blue-50 font-semibold py-4 px-8 h-auto"
              >
                شاهد الباقات
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="text-center rounded-2xl bg-white/60 backdrop-blur border border-white shadow-sm py-5 px-3"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p className="text-3xl md:text-4xl font-extrabold text-gradient-brand tabular-nums">
                  {s.value}
                </p>
                <p className="text-sm text-slate-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-app py-20 border-t border-slate-100">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-brand-600">المميزات</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
            كل ما تحتاجه في مكان واحد
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            أدوات احترافية مصممة خصيصاً لمكاتب المحاماة في المملكة العربية السعودية
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card-lift rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-300"
              >
                <div
                  className={`size-14 rounded-xl ring-4 ${f.color} grid place-items-center mb-4`}
                >
                  <Icon className="size-7" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Us */}
      <section id="why-us" className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="container-app">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand-600">لماذا نحن</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              لماذا {APP_NAME}؟
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
              مزايا تجعلنا الخيار الأول لمكاتب المحاماة السعودية
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((w) => {
              const Icon = w.icon;
              return (
                <div
                  key={w.title}
                  className="card-lift rounded-2xl bg-white p-6 text-center border border-slate-100"
                >
                  <div
                    className={`size-16 rounded-2xl ${w.color} mx-auto grid place-items-center mb-4`}
                  >
                    <Icon className="size-8" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    {w.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {w.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container-app py-20">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-brand-600">الأسعار</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
            باقات تناسب كل مكتب
          </h2>
          <p className="mt-3 text-slate-600">
            ابدأ بتجربة مجانية لمدة 14 يوم بدون بطاقة ائتمان
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {Object.entries(PLANS).map(([key, plan], i) => {
            const featured = i === 1;
            return (
              <div
                key={key}
                className={`card-lift rounded-2xl p-8 flex flex-col relative ${
                  featured
                    ? "bg-brand-gradient text-white ring-4 ring-brand-200 shadow-2xl md:scale-105"
                    : "border border-slate-200 bg-white"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                    الأكثر طلباً
                  </span>
                )}
                <h3 className={`text-xl font-bold ${featured ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <div className="mt-4">
                  <span
                    className={`text-4xl font-extrabold tabular-nums ${
                      featured ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span className={`ms-1 ${featured ? "text-brand-100" : "text-slate-500"}`}>
                    ر.س / شهرياً
                  </span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-sm ${
                        featured ? "text-brand-50" : "text-slate-700"
                      }`}
                    >
                      <Check
                        className={`size-4 shrink-0 mt-0.5 ${
                          featured ? "text-white" : "text-emerald-600"
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/register?plan=${key}`} className="mt-8">
                  <Button
                    className={`w-full ${featured ? "bg-white text-brand-700 hover:bg-slate-100 shadow-md" : ""}`}
                    variant={featured ? "secondary" : "outline"}
                  >
                    اختر {plan.name}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="container-app">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand-600">آراء العملاء</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">
              مكاتب تثق بنا
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
              اسمع من مكاتب محاماة تستخدم {APP_NAME} يومياً
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="card-lift rounded-2xl bg-white p-6 border border-slate-100"
              >
                <Quote className="size-7 text-brand-300 mb-3" />
                <p className="text-slate-700 leading-relaxed">{t.text}</p>
                <div className="flex items-center gap-1 mt-4 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-app py-16">
        <div className="rounded-3xl bg-brand-gradient px-8 py-14 text-center text-white shadow-2xl shadow-brand-600/30 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-16 -left-16 size-64 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold">
              جاهز لتطوير مكتبك؟
            </h2>
            <p className="mt-3 text-brand-100 max-w-2xl mx-auto">
              انضم لأكثر من 500 مكتب محاماة يدير عمله بكفاءة عبر {APP_NAME}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="bg-white text-[#1d4ed8] hover:bg-slate-100 font-bold shadow-lg">
                  ابدأ تجربتك المجانية الآن
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#1d4ed8] font-semibold">
                  تواصل مع المبيعات
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="container-app py-16 border-t border-slate-100">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="card-lift rounded-2xl p-6 bg-white border border-slate-100">
            <div className="size-14 rounded-full bg-blue-50 text-blue-600 mx-auto grid place-items-center mb-3">
              <Phone className="size-6" />
            </div>
            <p className="text-sm text-slate-500 mb-1">اتصل بنا</p>
            <p className="font-semibold text-slate-900 tabular-nums" dir="ltr">
              +966 11 234 5678
            </p>
          </div>
          <div className="card-lift rounded-2xl p-6 bg-white border border-slate-100">
            <div className="size-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto grid place-items-center mb-3">
              <Mail className="size-6" />
            </div>
            <p className="text-sm text-slate-500 mb-1">راسلنا</p>
            <p className="font-semibold text-slate-900">support@mohamiplus.sa</p>
          </div>
          <div className="card-lift rounded-2xl p-6 bg-white border border-slate-100">
            <div className="size-14 rounded-full bg-violet-50 text-violet-600 mx-auto grid place-items-center mb-3">
              <MapPin className="size-6" />
            </div>
            <p className="text-sm text-slate-500 mb-1">العنوان</p>
            <p className="font-semibold text-slate-900">الرياض، المملكة العربية السعودية</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="container-app py-14">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="size-9 rounded-lg bg-brand-gradient grid place-items-center text-white font-bold text-lg">
                  م
                </span>
                <span className="text-lg font-bold text-white">
                  {APP_NAME}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                نظام إدارة احترافي لمكاتب المحاماة، مصمم خصيصاً للسوق السعودي.
              </p>
              <div className="mt-5 flex items-center gap-3">
                {[Globe, MessageCircle, Share2, Send].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    aria-label="social"
                    className="size-9 rounded-full bg-slate-800 hover:bg-brand-600 grid place-items-center text-slate-300 hover:text-white transition-colors"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
            <FooterCol
              title="المنتج"
              links={[
                { label: "المميزات", href: "#features" },
                { label: "التسعير", href: "#pricing" },
                { label: "لماذا نحن", href: "#why-us" },
                { label: "آراء العملاء", href: "#testimonials" },
              ]}
            />
            <FooterCol
              title="الدعم"
              links={[
                { label: "تواصل معنا", href: "#contact" },
                { label: "الشروط والأحكام", href: "#" },
                { label: "سياسة الخصوصية", href: "#" },
                { label: "الأسئلة الشائعة", href: "#" },
              ]}
            />
            <FooterCol
              title="للعملاء"
              links={[
                { label: "تسجيل دخول", href: "/login" },
                { label: "ابدأ تجربة مجانية", href: "/register" },
                { label: "الدعم الفني", href: "#contact" },
                { label: "حالة المنصة", href: "#" },
              ]}
            />
          </div>
          <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} {APP_NAME} — جميع الحقوق محفوظة</span>
            <span>صُنع في المملكة العربية السعودية 🇸🇦</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-semibold text-white mb-4">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-slate-400 hover:text-brand-400 transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
