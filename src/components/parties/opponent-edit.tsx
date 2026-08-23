"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { OpponentForm } from "@/components/parties/opponent-form";
import { useOpponent } from "@/hooks/use-opponents";

const RETURN_TO = "/dashboard/parties/opponents";

export function OpponentEdit({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useOpponent(id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "سجل الخصوم", href: RETURN_TO },
          { label: "تعديل الخصم" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الخصم</h1>
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
        <OpponentForm
          mode="edit"
          returnTo={RETURN_TO}
          initial={{
            id: data.id,
            name: data.name,
            idNumber: data.idNumber,
            phone: data.phone,
            email: data.email,
            address: data.address,
            status: data.status,
            notes: data.notes,
          }}
        />
      )}
    </div>
  );
}
