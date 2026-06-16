import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CaseForm } from "@/components/cases/case-form";

export const metadata: Metadata = { title: "قضية جديدة" };

export default function NewCasePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "القضايا", href: "/dashboard/cases" },
          { label: "قضية جديدة" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">قضية جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          املأ بيانات القضية الجديدة. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>

      <CaseForm mode="create" />
    </div>
  );
}
