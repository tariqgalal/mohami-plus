import type { Metadata } from "next";
import Link from "next/link";
import { Globe, ChevronLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "واجهة وثائق" };

const SERVICES = [
  {
    href: "/dashboard/wathiq/commercial-registry",
    title: "السجل التجاري",
    desc: "التحقق من بيانات السجلات التجارية",
  },
  {
    href: "/dashboard/wathiq/company-contracts",
    title: "عقود الشركات",
    desc: "الاطلاع على عقود تأسيس الشركات",
  },
  {
    href: "/dashboard/wathiq/verify-poa",
    title: "التحقق من الوكالة",
    desc: "التحقق من صحة الوكالات الشرعية",
  },
  {
    href: "/dashboard/wathiq/national-address",
    title: "العنوان الوطني",
    desc: "الاستعلام عن العناوين الوطنية",
  },
  {
    href: "/dashboard/wathiq/employee-info",
    title: "معلومات الموظف",
    desc: "الاستعلام عن بيانات الموظفين",
  },
];

export default function WathiqIndexPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "واجهة وثائق" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Globe className="size-7 text-brand-600" />
          واجهة وثائق
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          خدمات التحقق من البيانات الرسمية عبر منصة «وثائق» — قيد التطوير
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:border-brand-300 hover:bg-brand-50/40">
              <CardContent className="p-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                </div>
                <ChevronLeft className="size-5 text-slate-400 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
