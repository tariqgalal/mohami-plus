"use client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { useTransaction } from "@/hooks/use-transactions";

interface TransactionEditProps {
  id: string;
  direction: "INCOMING" | "OUTGOING";
}

export function TransactionEdit({ id, direction }: TransactionEditProps) {
  const isIncoming = direction === "INCOMING";
  const listLabel = isIncoming ? "الوارد" : "الصادر";
  const returnTo = isIncoming
    ? "/dashboard/transactions/incoming"
    : "/dashboard/transactions/outgoing";

  const { data, isLoading, isError, error } = useTransaction(id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: listLabel, href: returnTo },
          { label: "تعديل المعاملة" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل المعاملة</h1>
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
        <TransactionForm
          mode="edit"
          returnTo={returnTo}
          initial={{
            id: data.id,
            registryNumber: data.registryNumber,
            subject: data.subject,
            direction: data.direction,
            receiveDate: data.receiveDate,
            receiveDateHijri: data.receiveDateHijri,
            sendDate: data.sendDate,
            sendDateHijri: data.sendDateHijri,
            senderName: data.senderName,
            recipientName: data.recipientName,
            department: data.department,
            status: data.status,
            notes: data.notes,
          }}
        />
      )}
    </div>
  );
}
