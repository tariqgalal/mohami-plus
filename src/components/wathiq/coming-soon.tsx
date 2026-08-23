import { Globe, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";

interface WathiqComingSoonProps {
  title: string;
  description: string;
}

/**
 * صفحة عنصر نائب لخدمات "واجهة وثائق" الحكومية — تُفعّل لاحقاً بعد ربط
 * مفتاح API الخاص بمنصة وثائق (wathiq.sa).
 */
export function WathiqComingSoon({ title, description }: WathiqComingSoonProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "واجهة وثائق" },
          { label: title },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Globe className="size-7 text-brand-600" />
          {title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <Card className="bg-gradient-to-br from-brand-600 to-violet-700 text-white border-0 shadow-xl shadow-brand-600/20 overflow-hidden relative">
        <div
          aria-hidden="true"
          className="absolute -top-20 -left-20 size-64 rounded-full bg-white/10 blur-3xl"
        />
        <CardContent className="p-8 relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium mb-4 backdrop-blur">
            <Sparkles className="size-3.5" />
            قريباً
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            سيتم تفعيل هذه الميزة قريباً
          </h2>
          <p className="text-white/80 max-w-lg mx-auto">
            نعمل على ربط منصة «وثائق» التابعة للمركز السعودي للأعمال للتحقق من
            البيانات الرسمية مباشرةً داخل محامي بلس.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
