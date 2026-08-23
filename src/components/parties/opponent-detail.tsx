"use client";

import Link from "next/link";
import { Edit, Mail, Phone, MapPin, IdCard, Swords } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useOpponent } from "@/hooks/use-opponents";
import { OPPONENT_STATUS } from "@/lib/constants";

const BASE_PATH = "/dashboard/parties/opponents";

const STATUS_VARIANTS: Record<string, "success" | "secondary"> = {
  ACTIVE: "success",
  ARCHIVED: "secondary",
};

function Field({
  icon: Icon,
  label,
  value,
  ltr = false,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 size-9 shrink-0 rounded-lg bg-slate-100 grid place-items-center text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p
          className={`text-sm text-slate-800 ${ltr ? "font-mono" : ""}`}
          dir={ltr ? "ltr" : undefined}
        >
          {value && value.trim() !== "" ? value : "—"}
        </p>
      </div>
    </div>
  );
}

export function OpponentDetail({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useOpponent(id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "سجل الخصوم", href: BASE_PATH },
          { label: data?.name ?? "عرض الخصم" },
        ]}
      />

      {isLoading && (
        <Card className="p-6 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Swords className="size-7 text-brand-600" />
                {data.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500 tabular-nums">
                  خصم رقم {data.number}
                </span>
                <Badge variant={STATUS_VARIANTS[data.status] ?? "secondary"}>
                  {(OPPONENT_STATUS as Record<string, string>)[data.status] ??
                    data.status}
                </Badge>
              </div>
            </div>
            <Link href={`${BASE_PATH}/${data.id}/edit`}>
              <Button variant="outline">
                <Edit className="size-4" />
                تعديل
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>بيانات الخصم</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-5">
              <Field
                icon={IdCard}
                label="رقم الهوية / السجل التجاري"
                value={data.idNumber}
                ltr
              />
              <Field icon={Phone} label="رقم الجوال" value={data.phone} ltr />
              <Field icon={Mail} label="البريد الإلكتروني" value={data.email} ltr />
              <Field icon={MapPin} label="العنوان" value={data.address} />
            </CardContent>
          </Card>

          {data.notes && data.notes.trim() !== "" && (
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {data.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
