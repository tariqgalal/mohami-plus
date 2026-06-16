"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserCog,
  Plus,
  Eye,
  Edit,
  Trash2,
  KeyRound,
  Mail,
  Phone,
  CircleCheck,
  CircleSlash,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ResetPasswordDialog } from "@/components/team/reset-password-dialog";
import {
  useTeamList,
  useDeleteTeamMember,
  useToggleTeamMemberActive,
} from "@/hooks/use-team-list";
import { USER_ROLES } from "@/lib/constants";
import { formatRelativeTime, formatDate } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { TeamFiltersInput } from "@/lib/validations/team";

export default function TeamPage() {
  const [filters, setFilters] = useState<Partial<TeamFiltersInput>>({
    page: 1,
    limit: 20,
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");
  const [resetTarget, setResetTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading, isError, error } = useTeamList(filters);
  const deleteMutation = useDeleteTeamMember();
  const toggleMutation = useToggleTeamMemberActive();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف العضو");
      setConfirmId(null);
    } catch (e: any) {
      toast.error(e.message || "فشل حذف العضو");
    }
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      await toggleMutation.mutateAsync({ id, isActive: !current });
      toast.success(current ? "تم تعليق الحساب" : "تم تفعيل الحساب");
    } catch (e: any) {
      toast.error(e.message || "فشل تغيير الحالة");
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const hasFilters = !!(filters.q || filters.role || filters.isActive !== undefined);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الفريق" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">فريق العمل</h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة المحامين والموظفين والصلاحيات
          </p>
        </div>
        <Link href="/dashboard/team/new">
          <Button>
            <Plus className="size-4" />
            عضو جديد
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.q ?? ""}
            onChange={(q) => setFilters({ ...filters, q, page: 1 })}
            placeholder="بحث بالاسم أو البريد..."
            className="lg:max-w-md flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.role ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  role: (e.target.value || undefined) as never,
                  page: 1,
                })
              }
              className="w-auto min-w-36"
            >
              <option value="">كل الأدوار</option>
              {Object.entries(USER_ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select
              value={
                filters.isActive === undefined
                  ? ""
                  : filters.isActive
                    ? "true"
                    : "false"
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  isActive:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                  page: 1,
                })
              }
              className="w-auto min-w-32"
            >
              <option value="">كل الحالات</option>
              <option value="true">مفعّل</option>
              <option value="false">معطّل</option>
            </Select>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={4} cols={6} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={UserCog}
          title={hasFilters ? "لا توجد نتائج" : "لا يوجد أعضاء بعد"}
          description={
            hasFilters
              ? "جرّب تعديل عوامل التصفية"
              : "أضف محامين وموظفين لمكتبك"
          }
          action={
            !hasFilters && (
              <Link href="/dashboard/team/new">
                <Button>
                  <Plus className="size-4" />
                  إضافة عضو
                </Button>
              </Link>
            )
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <Card
              key={m.id}
              className={`p-5 hover:shadow-md transition-shadow ${
                !m.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-semibold shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/team/${m.id}`}
                      className="font-semibold text-slate-900 hover:text-brand-600 truncate"
                    >
                      {m.name}
                    </Link>
                    {m.isActive ? (
                      <Badge variant="success" className="shrink-0">
                        <CircleCheck className="size-3 me-1 inline" />
                        مفعّل
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        <CircleSlash className="size-3 me-1 inline" />
                        معطّل
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {USER_ROLES[m.role]}
                    {m.specialization ? ` · ${m.specialization}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5 truncate">
                  <Mail className="size-3.5 shrink-0" /> {m.email}
                </p>
                {m.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="size-3.5 shrink-0" /> {m.phone}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex gap-3 text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-900">
                      {m._count.assignedCases}
                    </span>{" "}
                    قضية
                  </span>
                  <span>
                    <span className="font-semibold text-slate-900">
                      {m._count.sessions}
                    </span>{" "}
                    جلسة
                  </span>
                </div>
                <span className="text-slate-400">
                  {m.lastLoginAt
                    ? formatRelativeTime(m.lastLoginAt)
                    : "لم يدخل بعد"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1">
                <Link href={`/dashboard/team/${m.id}`}>
                  <Button variant="ghost" size="icon" aria-label="عرض">
                    <Eye className="size-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/team/${m.id}/edit`}>
                  <Button variant="ghost" size="icon" aria-label="تعديل">
                    <Edit className="size-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="إعادة تعيين كلمة المرور"
                  onClick={() =>
                    setResetTarget({ id: m.id, name: m.name })
                  }
                >
                  <KeyRound className="size-4 text-amber-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={m.isActive ? "تعليق" : "تفعيل"}
                  onClick={() => handleToggle(m.id, m.isActive)}
                >
                  <Power
                    className={`size-4 ${
                      m.isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="حذف"
                  onClick={() => {
                    setConfirmId(m.id);
                    setConfirmName(m.name);
                  }}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          limit={data.limit}
          onPageChange={(p) => setFilters({ ...filters, page: p })}
        />
      )}

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="حذف العضو"
        description={`هل أنت متأكد من حذف ${confirmName}؟ لا يمكن الحذف إذا كان معيّن على قضايا.`}
        confirmText="حذف"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {resetTarget && (
        <ResetPasswordDialog
          userId={resetTarget.id}
          userName={resetTarget.name}
          open={!!resetTarget}
          onOpenChange={(o) => !o && setResetTarget(null)}
        />
      )}
    </div>
  );
}
