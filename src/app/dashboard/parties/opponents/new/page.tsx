import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { OpponentForm } from "@/components/parties/opponent-form";

export const metadata: Metadata = { title: "خصم جديد" };

export default function NewOpponentPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "سجل الخصوم", href: "/dashboard/parties/opponents" },
          { label: "خصم جديد" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">خصم جديد</h1>
        <p className="text-sm text-slate-500 mt-1">
          أضف خصماً إلى السجل الموحّد. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <OpponentForm mode="create" returnTo="/dashboard/parties/opponents" />
    </div>
  );
}
