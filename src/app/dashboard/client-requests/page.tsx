"use client";

import { useState } from "react";
import Link from "next/link";
import { Headphones, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExportButton } from "@/components/shared/export-button";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import {
  ServiceRequestStatusBadge,
  RequestSourceBadge,
  formatTimeSpent,
} from "@/components/client-requests/service-request-badges";
import {
  useServiceRequests,
  useDeleteServiceRequest,
  type ServiceRequestItem,
} from "@/hooks/use-client-requests";
import {
  SERVICE_REQUEST_STATUS,
  REQUEST_SOURCE,
} from "@/lib/constants";
import { toast } from "@/store/toast-store";
import type { ServiceRequestFiltersInput } from "@/lib/validations/client-service-request";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  ...Object.entries(SERVICE_REQUEST_STATUS).map(([key, label]) => ({
    key,
    label,
  })),
];

export default function ClientRequestsPage() {
  const [filters, setFilters] = useState<Partial<ServiceRequestFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "date",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useServiceRequests(filters);
  const deleteMutation = useDeleteServiceRequest();

  const activeTab = (filters.status as string) ?? "";
  const counts = data?.statusCounts ?? {};
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  function setTab(key: string) {
    setFilters((f) => ({
      ...f,
      status: (key || undefined) as ServiceRequestFiltersInput["status"],
      page: 1,
    }));
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الطلب");
      setConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حذف الطلب");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const startIndex = ((data?.page ?? 1) - 1) * (data?.limit ?? 20);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "طلبات خدمات العملاء" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            سجل طلبات خدمات العملاء
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            استقبال ومتابعة طلبات العملاء الجديدة عبر مسار الموافقة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<ServiceRequestItem>
            filename="client-service-requests"
            columns={[
              {
                header: "مصدر الطلب",
                accessor: (r) =>
                  (REQUEST_SOURCE as Record<string, string>)[r.source] ??
                  r.source,
              },
              { header: "نوع الطلب", accessor: (r) => r.requestType },
              { header: "النوع الفرعي", accessor: (r) => r.requestSubType ?? "" },
              { header: "الطلب", accessor: (r) => r.description },
              { header: "اسم مقدم الطلب", accessor: (r) => r.applicantName },
              { header: "الجوال", accessor: (r) => r.applicantPhone ?? "" },
              { header: "المكلَّف", accessor: (r) => r.assignedToName ?? "" },
              {
                header: "الحالة",
                accessor: (r) =>
                  (SERVICE_REQUEST_STATUS as Record<string, string>)[
                    r.status
                  ] ?? r.status,
              },
            ]}
            fetcher={async () => {
              const params = new URLSearchParams({
                ...Object.fromEntries(
                  Object.entries(filters)
                    .filter(([, v]) => v !== undefined && v !== null && v !== "")
                    .map(([k, v]) => [k, String(v)]),
                ),
                page: "1",
                limit: "1000",
              });
              const res = await fetch(`/api/client-requests?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as ServiceRequestItem[];
            }}
          />
          <Link href="/dashboard/client-requests/new">
            <Button>
              <Plus className="size-4" />
              طلب جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* تابات الحالة */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const count = t.key === "" ? totalCount : counts[t.key] ?? 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap -mb-px border-b-2 ${
                active
                  ? "text-brand-700 border-brand-600"
                  : "text-slate-600 hover:text-slate-900 border-transparent"
              }`}
            >
              {t.label}
              <span className="ms-2 text-xs text-slate-400 tabular-nums">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* فلتر مصدر الطلب */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">مصدر الطلب:</span>
        <Select
          className="w-48"
          value={filters.source ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              source: (e.target.value ||
                undefined) as ServiceRequestFiltersInput["source"],
              page: 1,
            }))
          }
        >
          <option value="">الكل</option>
          {Object.entries(REQUEST_SOURCE).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={6} cols={7} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={Headphones}
          title="لا توجد طلبات"
          description="ابدأ بتسجيل أول طلب خدمة من العملاء"
          action={
            <Link href="/dashboard/client-requests/new">
              <Button>
                <Plus className="size-4" />
                إضافة طلب
              </Button>
            </Link>
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">مصدر الطلب</th>
                  <th className="px-4 py-3">نوع الطلب</th>
                  <th className="px-4 py-3">الطلب</th>
                  <th className="px-4 py-3">مقدم الطلب</th>
                  <th className="px-4 py-3">تاريخ الطلب</th>
                  <th className="px-4 py-3">عداد الوقت</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                      {startIndex + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <RequestSourceBadge source={r.source} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.requestType}
                      {r.requestSubType && (
                        <span className="block text-xs text-slate-400">
                          {r.requestSubType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {r.description}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.applicantName}
                    </td>
                    <td className="px-4 py-3">
                      <DualDateDisplay date={r.date} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums font-mono text-xs">
                      {formatTimeSpent(r.timeSpent)}
                    </td>
                    <td className="px-4 py-3">
                      <ServiceRequestStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/client-requests/${r.id}/edit`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/client-requests/${r.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="تعديل"
                          >
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => setConfirmId(r.id)}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="px-4 pb-4">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                limit={data.limit}
                onPageChange={(p) => setFilters({ ...filters, page: p })}
              />
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="حذف الطلب"
        description="سيتم حذف هذا الطلب نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
