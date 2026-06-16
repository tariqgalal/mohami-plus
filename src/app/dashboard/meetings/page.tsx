"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  Eye,
  Edit,
  Trash2,
  Video,
  MapPin,
  Clock,
  Users,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  MeetingStatusBadge,
  MeetingTypeBadge,
} from "@/components/meetings/meeting-status-badge";
import { RecordMinutesDialog } from "@/components/meetings/record-minutes-dialog";
import { useMeetings, useDeleteMeeting } from "@/hooks/use-meetings";
import { MEETING_STATUS, MEETING_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { MeetingFiltersInput } from "@/lib/validations/meeting";

export default function MeetingsPage() {
  const [filters, setFilters] = useState<Partial<MeetingFiltersInput>>({
    page: 1,
    limit: 20,
    sortBy: "date",
    sortDir: "asc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [minutesTarget, setMinutesTarget] = useState<{
    id: string;
    notes: string;
  } | null>(null);

  const { data, isLoading, isError, error } = useMeetings(filters);
  const deleteMutation = useDeleteMeeting();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف الاجتماع");
      setConfirmId(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل الحذف";
      toast.error(msg);
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const hasFilters = !!(filters.q || filters.status || filters.meetingType);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاجتماعات" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الاجتماعات</h1>
          <p className="text-sm text-slate-500 mt-1">
            جدولة وإدارة اجتماعات الموكلين والفريق
          </p>
        </div>
        <Link href="/dashboard/meetings/new">
          <Button>
            <Plus className="size-4" />
            اجتماع جديد
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.q ?? ""}
            onChange={(q) => setFilters({ ...filters, q, page: 1 })}
            placeholder="بحث بعنوان الاجتماع أو الموقع..."
            className="lg:max-w-md flex-1"
          />
          <div className="flex flex-wrap gap-2">
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
              {Object.entries(MEETING_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select
              value={filters.meetingType ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  meetingType: (e.target.value || undefined) as never,
                  page: 1,
                })
              }
              className="w-auto min-w-32"
            >
              <option value="">كل الأنواع</option>
              {Object.entries(MEETING_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={5} cols={6} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {!isLoading && isEmpty && (
        <EmptyState
          icon={CalendarDays}
          title={hasFilters ? "لا توجد اجتماعات تطابق التصفية" : "لا توجد اجتماعات بعد"}
          description={
            hasFilters
              ? "جرّب تعديل عوامل التصفية"
              : "ابدأ بجدولة أول اجتماع لموكل أو لفريقك"
          }
          action={
            !hasFilters && (
              <Link href="/dashboard/meetings/new">
                <Button>
                  <Plus className="size-4" />
                  اجتماع جديد
                </Button>
              </Link>
            )
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((m) => (
            <Card key={m.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/meetings/${m.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-600 line-clamp-2"
                  >
                    {m.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <MeetingTypeBadge type={m.meetingType} />
                    <MeetingStatusBadge status={m.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-slate-400" />
                  <span>{formatDate(m.date)}</span>
                  <span className="text-slate-400">·</span>
                  <span className="tabular-nums">{m.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-slate-400" />
                  <span>{m.duration} دقيقة</span>
                </div>
                {m.isVirtual ? (
                  <div className="flex items-center gap-2">
                    <Video className="size-4 text-slate-400" />
                    <span className="truncate">
                      {m.meetingLink ? (
                        <a
                          href={m.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          رابط الاجتماع
                        </a>
                      ) : (
                        "اجتماع افتراضي"
                      )}
                    </span>
                  </div>
                ) : m.location ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-slate-400" />
                    <span className="truncate">{m.location}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-slate-400" />
                  <span>{m.attendees.length} حضور</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                <Link href={`/dashboard/meetings/${m.id}`}>
                  <Button variant="ghost" size="icon" aria-label="عرض">
                    <Eye className="size-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/meetings/${m.id}/edit`}>
                  <Button variant="ghost" size="icon" aria-label="تعديل">
                    <Edit className="size-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="تسجيل محضر"
                  onClick={() =>
                    setMinutesTarget({ id: m.id, notes: m.notes ?? "" })
                  }
                >
                  <FileText className="size-4 text-emerald-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="حذف"
                  onClick={() => setConfirmId(m.id)}
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
        title="حذف الاجتماع"
        description="هل أنت متأكد من حذف هذا الاجتماع؟ لا يمكن التراجع."
        confirmText="حذف"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {minutesTarget && (
        <RecordMinutesDialog
          meetingId={minutesTarget.id}
          initialNotes={minutesTarget.notes}
          open={!!minutesTarget}
          onOpenChange={(o) => !o && setMinutesTarget(null)}
        />
      )}
    </div>
  );
}
