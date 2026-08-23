import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PoaForm } from "@/components/powers-of-attorney/poa-form";

export const metadata: Metadata = { title: "وكالة جديدة" };

export default function NewPowerOfAttorneyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الوكالات", href: "/dashboard/powers-of-attorney" },
          { label: "وكالة جديدة" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">وكالة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          أدخل بيانات الوكالة. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>

      <PoaForm mode="create" />
    </div>
  );
}
