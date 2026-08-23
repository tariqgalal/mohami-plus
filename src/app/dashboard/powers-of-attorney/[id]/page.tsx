import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, FileText, User } from "lucide-react";
import { getPowerOfAttorney } from "@/services/power-of-attorney-service";
import { getTenantId } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import {
  PoaStatusBadge,
  DaysRemainingCell,
} from "@/components/powers-of-attorney/poa-status-badge";
import { PrintButton } from "@/components/powers-of-attorney/print-button";
import { CLIENT_TYPES } from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Attachment = { url: string; name: string; size?: number; type?: string };

export default async function PowerOfAttorneyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const poa = await getPowerOfAttorney(tenantId, id);
  if (!poa) notFound();

  const attachments = Array.isArray(poa.attachments)
    ? (poa.attachments as unknown as Attachment[])
    : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الوكالات", href: "/dashboard/powers-of-attorney" },
          { label: `وكالة ${poa.number}` },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 font-mono">
            {poa.number}
          </h1>
          <PoaStatusBadge status={poa.status} />
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <PrintButton />
          <Link href={`/dashboard/powers-of-attorney/${poa.id}/edit`}>
            <Button>
              <Edit className="size-4" />
              تعديل
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الوكالة</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">العميل</p>
            <Link
              href={`/dashboard/clients/${poa.client.id}`}
              className="flex items-center gap-2 text-slate-900 hover:text-brand-600"
            >
              <User className="size-4 text-slate-400" />
              {poa.client.name}
              <span className="text-xs text-slate-400">
                ({(CLIENT_TYPES as Record<string, string>)[poa.client.clientType]})
              </span>
            </Link>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">الأيام المتبقية</p>
            <DaysRemainingCell endDate={poa.endDate} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">تاريخ البداية</p>
            <DualDateDisplay date={poa.startDate} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">تاريخ الانتهاء</p>
            <DualDateDisplay date={poa.endDate} />
          </div>
          {poa.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 mb-1">ملاحظات</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {poa.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المرفقات</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {attachments.map((a, i) => (
                <li
                  key={`${a.url}-${i}`}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2"
                >
                  <FileText className="size-4 text-slate-500 shrink-0" />
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate text-sm text-slate-700 hover:underline"
                  >
                    {a.name}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
