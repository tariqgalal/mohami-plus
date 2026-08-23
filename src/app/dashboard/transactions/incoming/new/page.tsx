import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const metadata: Metadata = { title: "معاملة واردة جديدة" };

export default function NewIncomingTransactionPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الوارد", href: "/dashboard/transactions/incoming" },
          { label: "معاملة جديدة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">معاملة واردة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          سجّل معاملة رسمية واردة. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <TransactionForm
        mode="create"
        defaultDirection="INCOMING"
        returnTo="/dashboard/transactions/incoming"
      />
    </div>
  );
}
