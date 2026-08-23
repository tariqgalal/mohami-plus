import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, User } from "lucide-react";
import { getBorrowing } from "@/services/borrowing-service";
import { getTenantId } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import { BorrowingStatusBadge } from "@/components/borrowings/borrowing-status-badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BorrowingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const borrowing = await getBorrowing(tenantId, id);
  if (!borrowing) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاستعارات", href: "/dashboard/borrowings" },
          { label: borrowing.documentName },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            {borrowing.documentName}
          </h1>
          <BorrowingStatusBadge status={borrowing.status} />
        </div>
        <Link href={`/dashboard/borrowings/${borrowing.id}/edit`}>
          <Button>
            <Edit className="size-4" />
            تعديل
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الاستعارة</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">الموظف المستعير</p>
            <span className="flex items-center gap-2 text-slate-900">
              <User className="size-4 text-slate-400" />
              {borrowing.employeeName}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">مصدر الوثيقة</p>
            <p className="text-sm text-slate-700">{borrowing.documentSource}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">نوع الوثيقة</p>
            <p className="text-sm text-slate-700">{borrowing.documentType}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">اسم/رقم الوثيقة</p>
            <p className="text-sm text-slate-700">{borrowing.documentName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">تاريخ الاستعارة</p>
            <DualDateDisplay date={borrowing.borrowDate} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">تاريخ الإرجاع</p>
            <DualDateDisplay date={borrowing.returnDate} />
          </div>
          {borrowing.description && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 mb-1">الوصف</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {borrowing.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
