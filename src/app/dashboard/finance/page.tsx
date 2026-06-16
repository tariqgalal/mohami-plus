"use client";

import Link from "next/link";
import {
  Wallet,
  Plus,
  TrendingUp,
  AlertTriangle,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { useFinanceStats, useInvoices } from "@/hooks/use-invoices";
import { InvoiceStatusBadge } from "@/components/finance/invoice-status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/constants";

export default function FinancePage() {
  const { data: stats } = useFinanceStats();
  const { data: invoices } = useInvoices({
    page: 1,
    limit: 5,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const recent = invoices?.items ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المالية" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المالية</h1>
          <p className="text-sm text-slate-500 mt-1">
            الفواتير والمدفوعات وتقارير المكتب المالية
          </p>
        </div>
        <Link href="/dashboard/finance/invoices/new">
          <Button>
            <Plus className="size-4" />
            فاتورة جديدة
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-700"
          label="إجمالي المحصّل"
          value={stats ? formatCurrency(stats.paid) : "—"}
        />
        <StatCard
          icon={Wallet}
          color="bg-amber-50 text-amber-700"
          label="مستحقات قائمة"
          value={stats ? formatCurrency(stats.outstanding) : "—"}
        />
        <StatCard
          icon={AlertTriangle}
          color="bg-red-50 text-red-700"
          label="فواتير متأخرة"
          value={stats ? String(stats.overdueCount) : "—"}
        />
        <StatCard
          icon={FileText}
          color="bg-blue-50 text-blue-700"
          label="إجمالي الفواتير"
          value={stats ? String(stats.invoiceCount) : "—"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">آخر الفواتير</CardTitle>
            <Link
              href="/dashboard/finance/invoices"
              className="text-sm text-brand-600 hover:underline"
            >
              عرض الكل
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                <FileText className="size-10 mx-auto text-slate-300 mb-2" />
                لا توجد فواتير بعد
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/dashboard/finance/invoices/${inv.id}`}
                    className="flex items-center justify-between py-3 gap-3 hover:bg-slate-50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-slate-500">
                        {inv.invoiceNumber}
                      </p>
                      <p className="font-medium text-slate-900 truncate">
                        {inv.client.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {inv.description}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="font-bold text-slate-900 tabular-nums">
                        {formatCurrency(inv.totalAmount)}
                      </p>
                      <div className="mt-1">
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع الحالات</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats || stats.byStatus.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                لا توجد بيانات
              </p>
            ) : (
              <div className="space-y-3">
                {stats.byStatus.map((b) => (
                  <div key={b.status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {INVOICE_STATUS[b.status as keyof typeof INVOICE_STATUS] ?? b.status}
                      </span>
                      <span className="font-medium text-slate-900 tabular-nums">
                        {b._count}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 tabular-nums">
                      {formatCurrency(Number(b._sum.totalAmount ?? 0))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            ضريبة القيمة المضافة
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <p>
            يتم احتساب ضريبة القيمة المضافة بنسبة 15% تلقائياً على كل فاتورة جديدة
            عند تفعيل خيار الضريبة. يمكنك تعديل الإعداد على مستوى الفاتورة الواحدة.
          </p>
          {stats && stats.total > 0 && (
            <p className="mt-3 text-slate-500">
              إجمالي قيمة الفواتير (شامل الضريبة):{" "}
              <span className="font-bold text-slate-900">
                {formatCurrency(stats.total)}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Wallet;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">
            {value}
          </p>
        </div>
        <div className={`size-12 rounded-lg grid place-items-center ${color}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
