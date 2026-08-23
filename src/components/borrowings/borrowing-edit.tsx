"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { BorrowingForm } from "@/components/borrowings/borrowing-form";
import { useBorrowing } from "@/hooks/use-borrowings";

export function BorrowingEdit({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useBorrowing(id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاستعارات", href: "/dashboard/borrowings" },
          { label: "تعديل الاستعارة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الاستعارة</h1>
      </div>

      {isLoading && (
        <Card className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {data && (
        <BorrowingForm
          mode="edit"
          initial={{
            id: data.id,
            employeeId: data.employeeId,
            documentSource: data.documentSource,
            documentType: data.documentType,
            documentName: data.documentName,
            description: data.description,
            borrowDate: data.borrowDate,
            borrowDateHijri: data.borrowDateHijri,
            returnDate: data.returnDate,
            returnDateHijri: data.returnDateHijri,
            status: data.status,
          }}
        />
      )}
    </div>
  );
}
