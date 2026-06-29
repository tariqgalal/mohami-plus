import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BillingClient } from "@/components/billing/billing-client";

export const metadata = { title: "الاشتراك والفوترة — محامي بلس" };

export default function BillingPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاشتراك والفوترة" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          الاشتراك والفوترة
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          اختر الباقة المناسبة لمكتبك وطريقة الفوترة، وادفع بأمان عبر بوابة
          Moyasar.
        </p>
      </div>

      <BillingClient />
    </div>
  );
}
