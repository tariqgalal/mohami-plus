import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Users,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MeetingStatusBadge,
  MeetingTypeBadge,
} from "@/components/meetings/meeting-status-badge";
import { getTenantId } from "@/lib/tenant";
import { getMeeting } from "@/services/meeting-service";
import { formatDate, formatDateTime } from "@/lib/format";
import { getInitials } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const m = await getMeeting(tenantId, id);
  if (!m) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاجتماعات", href: "/dashboard/meetings" },
          { label: m.title },
        ]}
      />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <MeetingStatusBadge status={m.status} />
            <MeetingTypeBadge type={m.meetingType} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{m.title}</h1>
        </div>

        <Link href={`/dashboard/meetings/${id}/edit`}>
          <Button>
            <Edit className="size-4" />
            تعديل
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">بيانات الاجتماع</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <Row
                icon={CalendarIcon}
                label="التاريخ"
                value={formatDate(m.date)}
              />
              <Row icon={Clock} label="الوقت" value={`${m.time} · ${m.duration} دقيقة`} />
              {m.isVirtual ? (
                <Row
                  icon={Video}
                  label="رابط الاجتماع"
                  value={
                    m.meetingLink ? (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline break-all"
                      >
                        {m.meetingLink}
                      </a>
                    ) : (
                      "اجتماع افتراضي"
                    )
                  }
                />
              ) : (
                <Row
                  icon={MapPin}
                  label="الموقع"
                  value={m.location ?? "—"}
                />
              )}
              <Row
                icon={CalendarIcon}
                label="تاريخ الإنشاء"
                value={formatDateTime(m.createdAt)}
              />

              {m.notes && (
                <div className="sm:col-span-2 space-y-1 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">ملاحظات / جدول الأعمال</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{m.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4 text-slate-500" />
                الحضور ({m.attendees.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {m.attendees.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-2">
                  لا يوجد حضور مسجلون
                </p>
              )}
              {m.attendees.map((a) => {
                const name = a.user?.name ?? a.externalName ?? "—";
                const sub = a.user
                  ? a.user.email
                  : a.externalEmail ?? "حاضر خارجي";
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-sm font-semibold">
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{sub}</p>
                    </div>
                  </div>
                );
              })}
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
  icon: typeof CalendarIcon;
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
