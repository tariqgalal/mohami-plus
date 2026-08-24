import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, Briefcase } from "lucide-react";
import { getJudgment } from "@/services/judgment-service";
import { getTenantId } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import {
  ObjectionStatusBadge,
  JudgmentResultBadge,
  JudgmentLevelBadge,
} from "@/components/judgments/judgment-badges";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JudgmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const judgment = await getJudgment(tenantId, id);
  if (!judgment) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الأحكام", href: "/dashboard/judgments" },
          { label: judgment.caseTitle },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">
            {judgment.caseTitle}
          </h1>
          <JudgmentResultBadge result={judgment.judgmentResult} />
          <ObjectionStatusBadge status={judgment.objectionStatus} />
        </div>
        <Link href={`/dashboard/judgments/${judgment.id}/edit`}>
          <Button>
            <Edit className="size-4" />
            تعديل
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الحكم</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">القضية</p>
            <Link
              href={`/dashboard/cases/${judgment.caseId}`}
              className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
            >
              <Briefcase className="size-4 text-slate-400" />
              {judgment.caseNumber} — {judgment.caseTitle}
            </Link>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">درجة الترافع</p>
            <JudgmentLevelBadge level={judgment.judgmentLevel} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">تاريخ استلام الحكم</p>
            <DualDateDisplay date={judgment.receiveDate} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">آخر موعد للاعتراض</p>
            <DualDateDisplay date={judgment.objectionDeadline} />
          </div>
          {judgment.judgmentSummary && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 mb-1">ملخص نص الحكم</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {judgment.judgmentSummary}
              </p>
            </div>
          )}
          {judgment.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 mb-1">ملاحظات</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {judgment.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
