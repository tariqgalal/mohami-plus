import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  Gavel,
  FileText,
  Wallet,
  Activity as ActivityIcon,
  Briefcase,
  Building2,
  User,
  Calendar,
  Phone,
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
import {
  CaseStatusBadge,
  PriorityBadge,
} from "@/components/cases/case-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCase } from "@/services/case-service";
import { getTenantId } from "@/lib/tenant";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { CASE_TYPES, USER_ROLES } from "@/lib/constants";
import { CaseDetailActions } from "@/components/cases/case-detail-actions";
import { CasePrintButtons } from "@/components/cases/case-print-buttons";
import { CaseArchiveButton } from "@/components/cases/case-archive-button";
import { AttachmentInput } from "@/components/shared/attachment-input";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const item = await getCase(tenantId, id);
  if (!item) notFound();

  const primary = item.lawyers.find((l) => l.isPrimary);
  const assistants = item.lawyers.filter((l) => !l.isPrimary);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "القضايا", href: "/dashboard/cases" },
          { label: item.title },
        ]}
      />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-mono text-sm text-slate-500 tabular-nums">
              {item.caseNumber}
            </span>
            <CaseStatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
            <Badge variant="outline">
              {(CASE_TYPES as Record<string, string>)[item.caseType]}
            </Badge>
            {item.archivedAt && (
              <Badge variant="secondary" className="gap-1">
                مؤرشفة
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CasePrintButtons caseId={id} />
          <CaseArchiveButton caseId={id} archived={!!item.archivedAt} />
          <Link href={`/dashboard/cases/${id}/edit`}>
            <Button>
              <Edit className="size-4" />
              تعديل
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={Gavel}
          label="الجلسات"
          value={item._count.sessions}
        />
        <StatTile
          icon={FileText}
          label="المستندات"
          value={item._count.documents}
        />
        <StatTile
          icon={Wallet}
          label="الفواتير"
          value={item._count.invoices}
        />
        <StatTile
          icon={Briefcase}
          label="القيمة"
          value={item.value ? formatCurrency(Number(item.value)) : "—"}
        />
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">ملخص</TabsTrigger>
          <TabsTrigger value="sessions">
            الجلسات ({item._count.sessions})
          </TabsTrigger>
          <TabsTrigger value="documents">
            المستندات ({item._count.documents})
          </TabsTrigger>
          <TabsTrigger value="finance">
            المالية ({item._count.invoices})
          </TabsTrigger>
          <TabsTrigger value="timeline">سجل الأحداث</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">تفاصيل القضية</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                  <KV label="التصنيف الرئيسي" value={item.classification} />
                  <KV label="نوع الدعوى" value={item.lawsuitType} />
                  <KV label="المحكمة" value={item.court} />
                  <KV label="مدينة المحكمة" value={item.courtCity} />
                  <KV label="الفرع" value={item.branch} />
                  <KV
                    label="رقم المعاملة"
                    value={item.establishmentTxnNumber}
                  />
                  <KV
                    label="تاريخ رفع الدعوى"
                    value={formatDate(item.filingDate)}
                  />
                  <KV
                    label="تاريخ الإنشاء"
                    value={formatDateTime(item.createdAt)}
                  />
                  <KV
                    label="تاريخ الإغلاق"
                    value={formatDate(item.closingDate)}
                  />
                  <KV label="النتيجة" value={item.result} />
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-xs text-slate-500">الوصف</p>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {item.description || "—"}
                    </p>
                  </div>
                  {item.notes && (
                    <div className="sm:col-span-2 space-y-1 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-xs font-medium text-amber-900">
                        ملاحظات داخلية
                      </p>
                      <p className="text-slate-700 whitespace-pre-wrap text-xs">
                        {item.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {item.opponents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      الخصوم ({item.opponents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.opponents.map((o) => (
                      <div
                        key={o.id}
                        className="p-3 border border-slate-200 rounded-md"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-slate-900">{o.name}</p>
                          {o.type && (
                            <Badge variant="secondary">{o.type}</Badge>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                          {o.lawyer && (
                            <span className="flex items-center gap-1">
                              <User className="size-3" /> {o.lawyer}
                            </span>
                          )}
                          {o.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" /> {o.phone}
                            </span>
                          )}
                        </div>
                        {o.notes && (
                          <p className="text-xs text-slate-500 mt-2">{o.notes}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="size-4 text-slate-500" />
                    العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Link
                    href={`/dashboard/clients/${item.client.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {item.client.name}
                  </Link>
                  <p className="text-slate-600">{item.client.phone}</p>
                  <p className="text-slate-500 text-xs">{item.client.city}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">المحامون</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {primary && (
                    <div className="flex items-center gap-2 p-2 bg-brand-50 rounded-md">
                      <div className="size-9 rounded-full bg-brand-600 text-white grid place-items-center text-sm font-semibold">
                        {primary.user.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {primary.user.name}
                        </p>
                        <p className="text-xs text-brand-700">المحامي الرئيسي</p>
                      </div>
                    </div>
                  )}
                  {assistants.map((l) => (
                    <div key={l.user.id} className="flex items-center gap-2 p-2">
                      <div className="size-9 rounded-full bg-slate-200 text-slate-700 grid place-items-center text-sm font-semibold">
                        {l.user.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-900">{l.user.name}</p>
                        <p className="text-xs text-slate-500">
                          {USER_ROLES[l.user.role]}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">إنشاء القضية</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="text-slate-700">{item.createdBy.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <div className="flex justify-end mb-3">
            <CaseDetailActions caseId={id} variant="session" />
          </div>
          {item.sessions.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="لا توجد جلسات بعد"
              description="ستظهر هنا كل جلسات القضية المسجلة"
            />
          ) : (
            <div className="space-y-3">
              {item.sessions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="size-5 text-brand-600" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatDate(s.date)} — {s.time}
                        </p>
                        <p className="text-xs text-slate-500">
                          {s.court} {s.hall ? `· القاعة ${s.hall}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{s.lawyer.name}</span>
                      <Badge variant="outline">{s.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-end">
                <CaseDetailActions caseId={id} variant="document" />
              </div>
              {item.documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="لا توجد مستندات"
                  description="ارفع توكيلات، عقود، أو أي مستندات تخص القضية"
                />
              ) : null}
            </div>
            <Card>
              <CardContent className="p-4">
                <AttachmentInput
                  owner={{ caseId: id }}
                  title="مرفقات (ملفات وروابط)"
                />
              </CardContent>
            </Card>
          </div>
          {item.documents.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {item.documents.map((d) => (
                <Card key={d.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="size-8 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {d.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(d.createdAt)}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 hover:underline"
                          >
                            معاينة
                          </a>
                          <a
                            href={d.fileUrl}
                            download={d.name}
                            className="text-xs text-slate-600 hover:underline"
                          >
                            تحميل
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="finance">
          <CaseFinanceTab
            caseId={id}
            clientId={item.client.id}
            caseValue={item.value ? Number(item.value) : 0}
            invoices={item.invoices.map((inv) => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              totalAmount: Number(inv.totalAmount),
              paidAmount: Number(inv.paidAmount),
              status: inv.status,
              dueDate: inv.dueDate,
            }))}
          />
        </TabsContent>

        <TabsContent value="timeline">
          {item.activities.length === 0 ? (
            <EmptyState
              icon={ActivityIcon}
              title="لا يوجد نشاط"
              description="سيظهر هنا سجل بكل التغييرات على القضية"
            />
          ) : (
            <Card>
              <CardContent className="p-4">
                <ol className="relative border-s-2 border-slate-200 space-y-4 ms-3">
                  {item.activities.map((a) => (
                    <li key={a.id} className="ms-4">
                      <span className="absolute -start-1.5 size-3 rounded-full bg-brand-500 ring-4 ring-white" />
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{a.user.name}</span>{" "}
                        <span className="text-slate-500">{activityLabel(a.action)}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDateTime(a.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
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
  icon: typeof Gavel;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-brand-50 text-brand-600 grid place-items-center shrink-0">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-900">{value || "—"}</p>
    </div>
  );
}

function activityLabel(action: string) {
  const map: Record<string, string> = {
    created: "أنشأ القضية",
    updated: "حدّث بيانات القضية",
    deleted: "حذف القضية",
    viewed: "اطّلع على القضية",
  };
  return map[action] ?? action;
}

interface FinanceInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: Date;
}

function CaseFinanceTab({
  caseId,
  clientId,
  caseValue,
  invoices,
}: {
  caseId: string;
  clientId: string;
  caseValue: number;
  invoices: FinanceInvoice[];
}) {
  const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
  const totalInvoiced = activeInvoices.reduce(
    (s, i) => s + i.totalAmount,
    0,
  );
  const totalPaid = activeInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const remaining = Math.max(0, totalInvoiced - totalPaid);
  const exceedsCase = caseValue > 0 && totalInvoiced > caseValue;
  const createUrl = `/dashboard/finance/invoices/new?clientId=${clientId}&caseId=${caseId}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <SummaryTile
            label="قيمة القضية"
            value={caseValue > 0 ? formatCurrency(caseValue) : "—"}
          />
          <SummaryTile
            label="إجمالي الفواتير"
            value={formatCurrency(totalInvoiced)}
            highlight={exceedsCase ? "warning" : undefined}
          />
          <SummaryTile
            label="المدفوع"
            value={formatCurrency(totalPaid)}
            highlight="success"
          />
          <SummaryTile
            label="المتبقي"
            value={formatCurrency(remaining)}
            highlight={remaining > 0 ? "warning" : undefined}
          />
        </div>
        <Link href={createUrl}>
          <Button>
            <Wallet className="size-4" />
            إنشاء فاتورة جديدة
          </Button>
        </Link>
      </div>

      {exceedsCase && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          ⚠️ إجمالي الفواتير ({formatCurrency(totalInvoiced)}) تجاوز قيمة القضية
          الأصلية ({formatCurrency(caseValue)}).
        </div>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="لا توجد فواتير"
          description="أنشئ فاتورة للعميل مرتبطة بهذه القضية"
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                <th className="px-4 py-3">الفاتورة</th>
                <th className="px-4 py-3">الإجمالي</th>
                <th className="px-4 py-3">المدفوع</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">الاستحقاق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/dashboard/finance/invoices/${inv.id}`}
                      className="text-brand-700 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatCurrency(inv.paidAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(inv.dueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "warning" | "success";
}) {
  const colorClass =
    highlight === "warning"
      ? "text-amber-700"
      : highlight === "success"
        ? "text-emerald-700"
        : "text-slate-900";
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`font-bold tabular-nums mt-1 ${colorClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
