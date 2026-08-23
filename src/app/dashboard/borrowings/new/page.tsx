import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BorrowingForm } from "@/components/borrowings/borrowing-form";

export const metadata: Metadata = { title: "استعارة جديدة" };

export default function NewBorrowingPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاستعارات", href: "/dashboard/borrowings" },
          { label: "استعارة جديدة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">استعارة جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">
          سجّل استعارة وثيقة جديدة. الحقول المعلمة بنجمة * إلزامية.
        </p>
      </div>
      <BorrowingForm mode="create" />
    </div>
  );
}
