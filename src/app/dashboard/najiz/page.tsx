import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Landmark, Shield, Zap, Sparkles, RefreshCcw } from "lucide-react";
import { NajizForm } from "./najiz-form";

export const metadata: Metadata = {
  title: "ربط ناجز",
};

const FEATURES = [
  {
    icon: RefreshCcw,
    title: "مزامنة تلقائية",
    desc: "تحديث حالة القضايا والجلسات من ناجز مباشرة إلى محامي بلس بدون إدخال يدوي",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Zap,
    title: "متابعة فورية",
    desc: "إشعارات لحظية عند صدور أحكام أو تحديثات على قضاياك في ناجز",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Shield,
    title: "آمن وموثوق",
    desc: "اتصال مشفّر يحترم سياسات وزارة العدل وبيانات موكليك",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function NajizPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="size-7 text-brand-600" />
          ربط ناجز
        </h1>
        <p className="text-slate-500 mt-1">
          ربط محامي بلس بنظام ناجز التابع لوزارة العدل السعودية
        </p>
      </div>

      <Card className="bg-gradient-to-br from-brand-600 to-violet-700 text-white border-0 shadow-xl shadow-brand-600/20 overflow-hidden relative">
        <div
          aria-hidden="true"
          className="absolute -top-20 -left-20 size-64 rounded-full bg-white/10 blur-3xl"
        />
        <CardContent className="p-8 relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium mb-4 backdrop-blur">
            <Sparkles className="size-3.5" />
            قريباً
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            تكامل كامل مع بوابة ناجز
          </h2>
          <p className="text-brand-50 mt-3 max-w-2xl leading-relaxed">
            نعمل حالياً على توفير ربط رسمي مع منصة ناجز يتيح لك مزامنة قضاياك،
            جلساتك، وأحكامك تلقائياً مع نظام محامي بلس. ترقّب الإطلاق قريباً.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title} className="card-lift">
              <CardContent className="p-5">
                <div
                  className={`size-11 rounded-xl ${f.color} grid place-items-center mb-3`}
                >
                  <Icon className="size-5" />
                </div>
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            البحث في قضية ناجز
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NajizForm />
        </CardContent>
      </Card>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex items-start gap-3">
        <Sparkles className="size-5 shrink-0 mt-0.5 text-amber-600" />
        <div>
          <p className="font-semibold">ملاحظة</p>
          <p className="text-amber-800 mt-1 leading-relaxed">
            هذه الخاصية قيد التطوير وستتيح مزامنة القضايا مع نظام ناجز تلقائياً.
            في الوقت الحالي يمكنك فتح بوابة ناجز مباشرة من الزر أعلاه للبحث عن
            قضاياك.
          </p>
        </div>
      </div>
    </div>
  );
}
