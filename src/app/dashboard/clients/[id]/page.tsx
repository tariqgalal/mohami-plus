import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  Briefcase,
  Wallet,
  Phone,
  Mail,
  MapPin,
  User,
  Building2,
  CreditCard,
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
import { getClient } from "@/services/client-service";
import {
  CLIENT_TYPES,
  CLIENT_STATUS,
  CASE_TYPES,
  INVOICE_STATUS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "success" | "secondary" | "destructive"
> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  BLOCKED: "destructive",
};

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const c = await getClient(tenantId, id);
  if (!c) notFound();

  const isOrg = c.clientType !== "INDIVIDUAL";
  const totalBilled = c.invoices.reduce(
    (s, inv) => s + Number(inv.totalAmount),
    0,
  );
  const totalPaid = c.invoices.reduce(
    (s, inv) => s + Number(inv.paidAmount),
    0,
  );
  const totalOutstanding = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "العملاء", href: "/dashboard/clients" },
          { label: c.name },
        ]}
      />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-4">
          <div
            className={`size-14 rounded-lg grid place-items-center text-white text-xl font-bold ${
              isOrg ? "bg-amber-600" : "bg-brand-600"
            }`}
          >
            {isOrg ? <Building2 className="size-7" /> : <User className="size-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline">
                {(CLIENT_TYPES as Record<string, string>)[c.clientType]}
              </Badge>
              <Badge variant={STATUS_VARIANTS[c.status] ?? "secondary"}>
                {(CLIENT_STATUS as Record<string, string>)[c.status]}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{c.name}</h1>
            {c.contactPerson && (
              <p className="text-sm text-slate-500 mt-1">
                جهة التواصل: {c.contactPerson}
              </p>
            )}
          </div>
        </div>

        <Link href={`/dashboard/clients/${id}/edit`}>
          <Button>
            <Edit className="size-4" />
            تعديل
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Briefcase} label="القضايا" value={c._count.cases} />
        <StatTile icon={Wallet} label="الفواتير" value={c._count.invoices} />
        <StatTile
          icon={CreditCard}
          label="إجمالي المطالبات"
          value={formatCurrency(totalBilled)}
        />
        <StatTile
          icon={Wallet}
          label="المتبقي"
          value={formatCurrency(totalOutstanding)}
          highlight={totalOutstanding > 0}
        />
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">الملف</TabsTrigger>
          <TabsTrigger value="cases">
            القضايا ({c._count.cases})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            الفواتير ({c._count.invoices})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">بيانات التواصل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row icon={Phone} label="الجوال" value={c.phone} />
                {c.secondaryPhone && (
                  <Row icon={Phone} label="إضافي" value={c.secondaryPhone} />
                )}
                {c.email && <Row icon={Mail} label="البريد" value={c.email} />}
                <Row
                  icon={MapPin}
                  label="العنوان"
                  value={`${c.city}${c.address ? ` — ${c.address}` : ""}`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">معلومات إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {c.nationalId && (
                  <KV
                    label={isOrg ? "السجل التجاري" : "رقم الهوية"}
                    value={c.nationalId}
                  />
                )}
                <KV label="تاريخ الإضافة" value={formatDate(c.createdAt)} />
                {c.idDocumentUrl && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      {isOrg ? "السجل التجاري" : "صورة الهوية"}
                    </p>
                    <a
                      href={c.idDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
                    >
                      <Mail className="size-4" />
                      {c.idDocumentName ?? "عرض الوثيقة"}
                    </a>
                  </div>
                )}
                {c.notes && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">ملاحظات</p>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {c.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cases">
          {c.cases.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="لا توجد قضايا"
              description="لم يتم تسجيل أي قضية لهذا العميل بعد"
              action={
                <Link href={`/dashboard/cases/new?clientId=${c.id}`}>
                  <Button>إضافة قضية</Button>
                </Link>
              }
            />
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                    <th className="px-4 py-3">رقم القضية</th>
                    <th className="px-4 py-3">العنوان</th>
                    <th className="px-4 py-3">النوع</th>
                    <th className="px-4 py-3">القيمة</th>
                    <th className="px-4 py-3">الأولوية</th>
                    <th className="px-4 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {c.cases.map((cs) => (
                    <tr key={cs.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">
                        {cs.caseNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/dashboard/cases/${cs.id}`}
                          className="hover:text-brand-600"
                        >
                          {cs.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {(CASE_TYPES as Record<string, string>)[cs.caseType]}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {cs.value ? formatCurrency(Number(cs.value)) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={cs.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <CaseStatusBadge status={cs.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices">
          {c.invoices.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="لا توجد فواتير"
              description="لم يتم إصدار أي فاتورة لهذا العميل"
            />
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                    <th className="px-4 py-3">الرقم</th>
                    <th className="px-4 py-3">الإجمالي</th>
                    <th className="px-4 py-3">المدفوع</th>
                    <th className="px-4 py-3">المتبقي</th>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-4 py-3">الاستحقاق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {c.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-mono text-xs">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatCurrency(Number(inv.totalAmount))}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatCurrency(Number(inv.paidAmount))}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatCurrency(
                          Number(inv.totalAmount) - Number(inv.paidAmount),
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {(INVOICE_STATUS as Record<string, string>)[inv.status]}
                        </Badge>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Briefcase;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`size-10 rounded-lg grid place-items-center shrink-0 ${
            highlight
              ? "bg-amber-50 text-amber-600"
              : "bg-brand-50 text-brand-600"
          }`}
        >
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

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
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

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-900">{value || "—"}</p>
    </div>
  );
}
