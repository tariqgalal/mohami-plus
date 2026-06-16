import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  Receipt,
  User,
  Briefcase,
  Calendar,
  FileText,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/finance/invoice-status-badge";
import { getTenantId } from "@/lib/tenant";
import { getInvoice } from "@/services/invoice-service";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { InvoiceActionsClient } from "./invoice-actions-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const inv = await getInvoice(tenantId, id);
  if (!inv) notFound();

  const totalAmount = Number(inv.totalAmount);
  const paidAmount = Number(inv.paidAmount);
  const outstanding = +(totalAmount - paidAmount).toFixed(2);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المالية", href: "/dashboard/finance" },
          { label: "الفواتير", href: "/dashboard/finance/invoices" },
          { label: inv.invoiceNumber },
        ]}
      />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <InvoiceStatusBadge status={inv.status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Receipt className="size-6 text-brand-600" />
            {inv.invoiceNumber}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{inv.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <InvoiceActionsClient
            invoiceId={inv.id}
            outstanding={outstanding}
            canRecordPayment={outstanding > 0 && inv.status !== "CANCELLED"}
          />
          <Link href={`/dashboard/finance/invoices/${id}/edit`}>
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
              <CardTitle className="text-base">تفاصيل الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">المبلغ الأساسي</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(inv.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">ضريبة القيمة المضافة</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(inv.tax)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 text-base">
                <span className="font-semibold text-slate-900">الإجمالي</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatCurrency(inv.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-slate-600">المدفوع</span>
                <span className="font-medium text-emerald-700 tabular-nums">
                  {formatCurrency(inv.paidAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">المتبقي</span>
                <span className="font-bold text-amber-700 tabular-nums">
                  {formatCurrency(outstanding)}
                </span>
              </div>

              {inv.notes && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-xs text-slate-500">ملاحظات</p>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {inv.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">سجل المدفوعات</CardTitle>
            </CardHeader>
            <CardContent>
              {inv.payments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  لا توجد دفعات مسجلة بعد
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {inv.payments.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 tabular-nums">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS]}
                          {p.reference && ` · ${p.reference}`}
                        </p>
                        {p.notes && (
                          <p className="text-xs text-slate-500 mt-1">
                            {p.notes}
                          </p>
                        )}
                        {p.receiptUrl && (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-600 hover:underline mt-1 inline-block"
                          >
                            {p.receiptName ?? "إيصال الدفع"}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 shrink-0">
                        {formatDateTime(p.paidAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="size-4 text-slate-500" />
                العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Link
                href={`/dashboard/clients/${inv.client.id}`}
                className="font-medium text-brand-700 hover:underline"
              >
                {inv.client.name}
              </Link>
              <p className="text-slate-600 tabular-nums">{inv.client.phone}</p>
              {inv.client.email && (
                <p className="text-slate-600">{inv.client.email}</p>
              )}
            </CardContent>
          </Card>

          {inv.case && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="size-4 text-slate-500" />
                  القضية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Link
                  href={`/dashboard/cases/${inv.case.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {inv.case.title}
                </Link>
                <p className="text-xs font-mono text-slate-500">
                  {inv.case.caseNumber}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-slate-500" />
                التواريخ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">الإصدار</span>
                <span className="text-slate-900">
                  {formatDate(inv.issueDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">الاستحقاق</span>
                <span className="text-slate-900">
                  {formatDate(inv.dueDate)}
                </span>
              </div>
              {inv.paidDate && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">السداد الكامل</span>
                  <span className="text-emerald-700 font-medium">
                    {formatDate(inv.paidDate)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-slate-500" />
                أنشأها
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-slate-700">{inv.createdBy.name}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
