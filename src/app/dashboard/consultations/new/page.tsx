import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConsultationForm } from "@/components/consultations/consultation-form";

export const metadata: Metadata = { title: "استشارة جديدة" };

export default function NewConsultationPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاستشارات", href: "/dashboard/consultations" },
          { label: "استشارة جديدة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">استشارة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          سجّل استشارة قانونية جديدة. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <ConsultationForm mode="create" />
    </div>
  );
}
