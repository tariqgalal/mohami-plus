import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ClientForm } from "@/components/clients/client-form";

export const metadata: Metadata = { title: "عميل جديد" };

export default function NewClientPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "العملاء", href: "/dashboard/clients" },
          { label: "عميل جديد" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">عميل جديد</h1>
        <p className="text-sm text-slate-500 mt-1">
          أضف عميلاً جديداً لمكتبك. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <ClientForm mode="create" />
    </div>
  );
}
