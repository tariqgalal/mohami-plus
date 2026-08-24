"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { JudgmentForm } from "@/components/judgments/judgment-form";
import { useJudgment } from "@/hooks/use-judgments";

export function JudgmentEdit({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useJudgment(id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الأحكام", href: "/dashboard/judgments" },
          { label: "تعديل الحكم" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الحكم</h1>
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
        <JudgmentForm
          mode="edit"
          initial={{
            id: data.id,
            caseId: data.caseId,
            judgmentLevel: data.judgmentLevel,
            judgmentResult: data.judgmentResult,
            judgmentSummary: data.judgmentSummary,
            receiveDate: data.receiveDate,
            receiveDateHijri: data.receiveDateHijri,
            objectionStatus: data.objectionStatus,
            objectionDeadline: data.objectionDeadline,
            notes: data.notes,
          }}
        />
      )}
    </div>
  );
}
