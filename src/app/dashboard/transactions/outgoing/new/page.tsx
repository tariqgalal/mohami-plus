import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const metadata: Metadata = { title: "معاملة صادرة جديدة" };

export default function NewOutgoingTransactionPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الصادر", href: "/dashboard/transactions/outgoing" },
          { label: "معاملة جديدة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">معاملة صادرة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          سجّل معاملة رسمية صادرة. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <TransactionForm
        mode="create"
        defaultDirection="OUTGOING"
        returnTo="/dashboard/transactions/outgoing"
      />
    </div>
  );
}
