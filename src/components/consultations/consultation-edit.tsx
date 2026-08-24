"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { ConsultationForm } from "@/components/consultations/consultation-form";
import { useConsultation } from "@/hooks/use-consultations";

export function ConsultationEdit({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useConsultation(id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاستشارات", href: "/dashboard/consultations" },
          { label: "تعديل الاستشارة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الاستشارة</h1>
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
        <ConsultationForm
          mode="edit"
          initial={{
            id: data.id,
            title: data.title,
            type: data.type,
            clientId: data.clientId,
            assignedTo: data.assignedTo,
            date: data.date,
            dateHijri: data.dateHijri,
            description: data.description,
            status: data.status,
          }}
        />
      )}
    </div>
  );
}
