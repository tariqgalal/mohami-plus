import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  Briefcase,
  Gavel,
  Mail,
  Phone,
  Calendar,
  Award,
  CircleCheck,
  CircleSlash,
  User,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CaseStatusBadge,
  PriorityBadge,
} from "@/components/cases/case-status-badge";
import { getTenantId } from "@/lib/tenant";
import { getTeamMember } from "@/services/team-service";
import { USER_ROLES } from "@/lib/constants";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamMemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const m = await getTeamMember(tenantId, id);
  if (!m) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الفريق", href: "/dashboard/team" },
          { label: m.name },
        ]}
      />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-4">
          {m.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.avatar}
              alt={m.name}
              className="size-16 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="size-16 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-2xl font-bold">
              {m.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline">{USER_ROLES[m.role]}</Badge>
              {m.isActive ? (
                <Badge variant="success">
                  <CircleCheck className="size-3 me-1 inline" /> مفعّل
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <CircleSlash className="size-3 me-1 inline" /> معطّل
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{m.name}</h1>
            {m.specialization && (
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <Award className="size-4" /> {m.specialization}
              </p>
            )}
          </div>
        </div>

        <Link href={`/dashboard/team/${id}/edit`}>
          <Button>
            <Edit className="size-4" />
            تعديل
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Briefcase} label="القضايا" value={m._count.assignedCases} />
        <StatTile icon={Gavel} label="الجلسات" value={m._count.sessions} />
        <StatTile
          icon={Calendar}
          label="تاريخ الانضمام"
          value={formatDate(m.createdAt)}
        />
        <StatTile
          icon={User}
          label="آخر دخول"
          value={
            m.lastLoginAt ? formatRelativeTime(m.lastLoginAt) : "لم يدخل بعد"
          }
        />
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">الملف</TabsTrigger>
          <TabsTrigger value="cases">
            القضايا ({m._count.assignedCases})
          </TabsTrigger>
          <TabsTrigger value="sessions">آخر الجلسات</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">بيانات الاتصال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row icon={Mail} label="البريد الإلكتروني" value={m.email} />
              {m.phone && <Row icon={Phone} label="الجوال" value={m.phone} />}
              <Row
                icon={Calendar}
                label="تاريخ الإضافة"
                value={formatDateTime(m.createdAt)}
              />
              {m.lastLoginAt && (
                <Row
                  icon={User}
                  label="آخر تسجيل دخول"
                  value={formatDateTime(m.lastLoginAt)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          {m.assignedCases.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="لا توجد قضايا"
              description="لم يتم تعيين هذا العضو على أي قضية بعد"
            />
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                    <th className="px-4 py-3">رقم القضية</th>
                    <th className="px-4 py-3">العنوان</th>
                    <th className="px-4 py-3">العميل</th>
                    <th className="px-4 py-3">الدور</th>
                    <th className="px-4 py-3">الأولوية</th>
                    <th className="px-4 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {m.assignedCases.map((cl) => (
                    <tr key={cl.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">
                        {cl.case.caseNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/dashboard/cases/${cl.case.id}`}
                          className="hover:text-brand-600"
                        >
                          {cl.case.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {cl.case.client.name}
                      </td>
                      <td className="px-4 py-3">
                        {cl.isPrimary ? (
                          <Badge variant="default">رئيسي</Badge>
                        ) : (
                          <Badge variant="secondary">مساعد</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={cl.case.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <CaseStatusBadge status={cl.case.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          {m.sessions.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="لا توجد جلسات"
              description="لم يحضر هذا العضو أي جلسة بعد"
            />
          ) : (
            <div className="space-y-3">
              {m.sessions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="size-5 text-brand-600" />
                      <div>
                        <Link
                          href={`/dashboard/cases/${s.case.id}`}
                          className="font-medium text-slate-900 hover:text-brand-600"
                        >
                          {s.case.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {formatDate(s.date)} — {s.time} · {s.court}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{s.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="font-bold text-slate-900 tabular-nums truncate">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
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
