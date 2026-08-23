import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ServiceRequestForm } from "@/components/client-requests/service-request-form";

export const metadata: Metadata = { title: "طلب خدمة جديد" };

export default function NewClientRequestPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "طلبات خدمات العملاء", href: "/dashboard/client-requests" },
          { label: "طلب جديد" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">طلب خدمة جديد</h1>
        <p className="text-sm text-slate-500 mt-1">
          سجّل طلب خدمة جديد من العملاء. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>

      <ServiceRequestForm mode="create" />
    </div>
  );
}
