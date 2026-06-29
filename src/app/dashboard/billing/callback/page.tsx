import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BillingCallbackClient } from "@/components/billing/billing-callback-client";

export const metadata = { title: "تأكيد الدفع — محامي بلس" };

export default function BillingCallbackPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاشتراك والفوترة", href: "/dashboard/billing" },
          { label: "تأكيد الدفع" },
        ]}
      />
      <BillingCallbackClient />
    </div>
  );
}
