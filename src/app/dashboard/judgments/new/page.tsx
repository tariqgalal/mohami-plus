import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JudgmentForm } from "@/components/judgments/judgment-form";

export const metadata: Metadata = { title: "حكم جديد" };

export default function NewJudgmentPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الأحكام", href: "/dashboard/judgments" },
          { label: "حكم جديد" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">حكم جديد</h1>
        <p className="text-sm text-slate-500 mt-1">
          سجّل حكماً جديداً مرتبطاً بقضية. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <JudgmentForm mode="create" />
    </div>
  );
}
