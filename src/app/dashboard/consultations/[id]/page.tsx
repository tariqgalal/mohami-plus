import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, User } from "lucide-react";
import { getConsultation } from "@/services/consultation-service";
import { getTenantId } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import { ConsultationStatusBadge } from "@/components/consultations/consultation-status-badge";
import { CONSULTATION_TYPE } from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Assignee {
  id: string;
  name: string;
}

export default async function ConsultationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const consultation = await getConsultation(tenantId, id);
  if (!consultation) notFound();

  const assignees = (consultation.assignedTo as Assignee[] | null) ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاستشارات", href: "/dashboard/consultations" },
          { label: consultation.title },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            <span className="text-slate-400 me-2 tabular-nums">
              #{consultation.number}
            </span>
            {consultation.title}
          </h1>
          <ConsultationStatusBadge status={consultation.status} />
        </div>
        <Link href={`/dashboard/consultations/${consultation.id}/edit`}>
          <Button>
            <Edit className="size-4" />
            تعديل
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الاستشارة</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">النوع</p>
            <p className="text-sm text-slate-700">
              {(CONSULTATION_TYPE as Record<string, string>)[
                consultation.type
              ] ?? consultation.type}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">العميل</p>
            <p className="text-sm text-slate-700">
              {consultation.clientName ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">التاريخ</p>
            <DualDateDisplay date={consultation.date} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">المسؤولون</p>
            {assignees.length ? (
              <div className="flex flex-wrap gap-2">
                {assignees.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    <User className="size-3 text-slate-400" />
                    {a.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}
          </div>
          {consultation.description && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 mb-1">الوصف</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {consultation.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
