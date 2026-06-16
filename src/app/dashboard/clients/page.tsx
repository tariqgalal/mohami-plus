"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus, Eye, Edit, Trash2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import {
  useClientsList,
  useDeleteClient,
  type ClientListItem,
} from "@/hooks/use-clients-list";
import { ExportButton } from "@/components/shared/export-button";
import { CLIENT_TYPES, CLIENT_STATUS, SAUDI_CITIES } from "@/lib/constants";
import { toast } from "@/store/toast-store";
import type { ClientFiltersInput } from "@/lib/validations/client";

const STATUS_VARIANTS: Record<
  string,
  "default" | "success" | "secondary" | "destructive"
> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  BLOCKED: "destructive",
};

export default function ClientsPage() {
  const [filters, setFilters] = useState<Partial<ClientFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useClientsList(filters);
  const deleteMutation = useDeleteClient();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف العميل");
      setConfirmId(null);
    } catch (e: any) {
      toast.error(e.message || "فشل حذف العميل");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const hasFilters = !!(
    filters.q ||
    filters.clientType ||
    filters.status ||
    filters.city
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "العملاء" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">العملاء</h1>
          <p className="text-sm text-slate-500 mt-1">
            ملفات شاملة لكل العملاء، قضاياهم، وفواتيرهم
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton<ClientListItem>
            filename="clients"
            columns={[
              { header: "الاسم", accessor: (r) => r.name },
              {
                header: "النوع",
                accessor: (r) =>
                  (CLIENT_TYPES as Record<string, string>)[r.clientType] ??
                  r.clientType,
              },
              { header: "الهاتف", accessor: (r) => r.phone },
              { header: "البريد", accessor: (r) => r.email ?? "" },
              { header: "المدينة", accessor: (r) => r.city },
              { header: "رقم الهوية", accessor: (r) => r.nationalId ?? "" },
              {
                header: "الحالة",
                accessor: (r) =>
                  (CLIENT_STATUS as Record<string, string>)[r.status] ??
                  r.status,
              },
              { header: "عدد القضايا", accessor: (r) => r._count?.cases ?? 0 },
              {
                header: "عدد الفواتير",
                accessor: (r) => r._count?.invoices ?? 0,
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
              const res = await fetch(`/api/clients?${params}`);
              const json = await res.json();
              return (json.data?.items ?? []) as ClientListItem[];
            }}
          />
          <Link href="/dashboard/clients/new">
            <Button>
              <Plus className="size-4" />
              عميل جديد
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.q ?? ""}
            onChange={(q) => setFilters({ ...filters, q, page: 1 })}
            placeholder="بحث بالاسم، الهاتف، البريد، أو رقم الهوية..."
            className="lg:max-w-md flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.clientType ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  clientType: (e.target.value || undefined) as never,
                  page: 1,
                })
              }
              className="w-auto min-w-36"
            >
              <option value="">كل الأنواع</option>
              {Object.entries(CLIENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value || undefined) as never,
                  page: 1,
                })
              }
              className="w-auto min-w-32"
            >
              <option value="">كل الحالات</option>
              {Object.entries(CLIENT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select
              value={filters.city ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  city: e.target.value || undefined,
                  page: 1,
                })
              }
              className="w-auto min-w-32"
            >
              <option value="">كل المدن</option>
              {SAUDI_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={6} cols={6} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={Users}
          title={hasFilters ? "لا توجد نتائج" : "لا يوجد عملاء بعد"}
          description={
            hasFilters
              ? "جرّب تعديل عوامل التصفية"
              : "ابدأ بإضافة أول عميل لمكتبك"
          }
          action={
            !hasFilters && (
              <Link href="/dashboard/clients/new">
                <Button>
                  <Plus className="size-4" />
                  إضافة عميل
                </Button>
              </Link>
            )
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-right text-xs font-medium text-slate-500 uppercase">
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">التواصل</th>
                  <th className="px-4 py-3">المدينة</th>
                  <th className="px-4 py-3">القضايا</th>
                  <th className="px-4 py-3">الفواتير</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`/dashboard/clients/${c.id}`}
                        className="hover:text-brand-600"
                      >
                        {c.name}
                      </Link>
                      {c.nationalId && (
                        <p className="text-xs text-slate-500 font-mono">
                          {c.nationalId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(CLIENT_TYPES as Record<string, string>)[c.clientType]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="flex items-center gap-1 text-slate-700">
                          <Phone className="size-3" /> {c.phone}
                        </span>
                        {c.email && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Mail className="size-3" /> {c.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.city}</td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {c._count.cases}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {c._count.invoices}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[c.status] ?? "secondary"}>
                        {(CLIENT_STATUS as Record<string, string>)[c.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/clients/${c.id}`}>
                          <Button variant="ghost" size="icon" aria-label="عرض">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/clients/${c.id}/edit`}>
                          <Button variant="ghost" size="icon" aria-label="تعديل">
                            <Edit className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => setConfirmId(c.id)}
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
        title="حذف العميل"
        description="هل أنت متأكد؟ لا يمكن التراجع. لن يتم الحذف إذا كان للعميل قضايا."
        confirmText="حذف"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
