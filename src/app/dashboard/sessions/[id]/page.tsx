import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Gavel,
  CheckCircle2,
  Briefcase,
  Building2,
  Bell,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SessionStatusBadge,
  SessionTypeBadge,
} from "@/components/sessions/session-status-badge";
import { SessionActionsClient } from "./session-actions-client";
import { getTenantId } from "@/lib/tenant";
import { getSession } from "@/services/session-service";
import { formatDate, formatDateTime } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const s = await getSession(tenantId, id);
  if (!s) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الجلسات", href: "/dashboard/sessions" },
          { label: `${formatDate(s.date)} ${s.time}` },
        ]}
      />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <SessionStatusBadge status={s.status} />
            <SessionTypeBadge type={s.sessionType} />
            {s.reminder && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Bell className="size-3" />
                تذكير مفعّل
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 flex-wrap">
            <CalendarIcon className="size-6 text-brand-600" />
            {formatDate(s.date)} — {s.time}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <SessionActionsClient sessionId={s.id} status={s.status} />
          <Link href={`/dashboard/sessions/${id}/edit`}>
            <Button>
              <Edit className="size-4" />
              تعديل
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">بيانات الجلسة</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <Row
                icon={Building2}
                label="المحكمة"
                value={s.court}
              />
              <Row
                icon={MapPin}
                label="القاعة / الدائرة"
                value={s.hall ?? "—"}
              />
              <Row icon={Gavel} label="القاضي" value={s.judge ?? "—"} />
              <Row icon={Clock} label="الوقت" value={s.time} />
              <Row
                icon={User}
                label="المحامي الحاضر"
                value={s.lawyer.name}
              />
              <Row
                icon={CalendarIcon}
                label="تاريخ الإنشاء"
                value={formatDateTime(s.createdAt)}
              />

              {s.notes && (
                <div className="sm:col-span-2 space-y-1 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">ملاحظات</p>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {s.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {s.result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  نتيجة الجلسة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-slate-700 whitespace-pre-wrap">{s.result}</p>
                {s.nextAction && (
                  <div className="space-y-1 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">الإجراء التالي</p>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {s.nextAction}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="size-4 text-slate-500" />
                القضية المرتبطة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link
                href={`/dashboard/cases/${s.case.id}`}
                className="font-medium text-brand-700 hover:underline block"
              >
                {s.case.title}
              </Link>
              <p className="text-xs font-mono text-slate-500">
                {s.case.caseNumber}
              </p>
              <p className="text-slate-600">
                العميل: {s.case.client.name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">المحامي الحاضر</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold">
                {s.lawyer.name.charAt(0)}
              </div>
              <div className="flex-1">
                <Link
                  href={`/dashboard/team/${s.lawyer.id}`}
                  className="text-sm font-medium text-slate-900 hover:text-brand-600"
                >
                  {s.lawyer.name}
                </Link>
                {s.lawyer.specialization && (
                  <p className="text-xs text-slate-500">
                    {s.lawyer.specialization}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-slate-900">{value}</p>
      </div>
    </div>
  );
}
