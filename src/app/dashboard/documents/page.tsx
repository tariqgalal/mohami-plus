"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  FileImage,
  File,
  FileSpreadsheet,
  Briefcase,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AddDocumentDialog } from "@/components/documents/add-document-dialog";
import { useDocuments, useDeleteDocument } from "@/hooks/use-documents";
import { DOC_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { toast } from "@/store/toast-store";
import type { DocumentFiltersInput } from "@/lib/validations/document";

function getFileIcon(type: string) {
  const t = type.toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(t)) return FileImage;
  if (["xls", "xlsx", "csv"].includes(t)) return FileSpreadsheet;
  if (["pdf", "doc", "docx"].includes(t)) return FileText;
  return File;
}

export default function DocumentsPage() {
  const [filters, setFilters] = useState<Partial<DocumentFiltersInput>>({
    page: 1,
    limit: 24,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, isError, error } = useDocuments(filters);
  const deleteMutation = useDeleteDocument();

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync(confirmId);
      toast.success("تم حذف المستند");
      setConfirmId(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل الحذف";
      toast.error(msg);
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && items.length === 0;
  const hasFilters = !!(filters.q || filters.category);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المستندات" },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المستندات</h1>
          <p className="text-sm text-slate-500 mt-1">
            تخزين وتصنيف مستندات القضايا والمكتب
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          إضافة مستند
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={filters.q ?? ""}
            onChange={(q) => setFilters({ ...filters, q, page: 1 })}
            placeholder="بحث باسم أو وصف المستند..."
            className="lg:max-w-md flex-1"
          />
          <Select
            value={filters.category ?? ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                category: (e.target.value || undefined) as never,
                page: 1,
              })
            }
            className="w-auto min-w-40"
          >
            <option value="">كل التصنيفات</option>
            {Object.entries(DOC_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-4">
          <TableSkeleton rows={4} cols={4} />
        </Card>
      )}

      {isError && (
        <Card className="p-6 text-center text-red-600">
          حدث خطأ: {(error as Error).message}
        </Card>
      )}

      {!isLoading && isEmpty && (
        <EmptyState
          icon={FileText}
          title={hasFilters ? "لا توجد مستندات تطابق التصفية" : "لا توجد مستندات بعد"}
          description={
            hasFilters
              ? "جرّب تعديل عوامل التصفية"
              : "ابدأ بإضافة أول مستند للمكتب أو لإحدى القضايا"
          }
          action={
            !hasFilters && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                إضافة مستند
              </Button>
            )
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((doc) => {
            const Icon = getFileIcon(doc.fileType);
            return (
              <Card
                key={doc.id}
                className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 uppercase">
                      {doc.fileType}
                    </p>
                  </div>
                </div>

                {doc.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-slate-100 text-slate-700">
                    {DOC_CATEGORIES[doc.category as keyof typeof DOC_CATEGORIES] ?? doc.category}
                  </Badge>
                </div>

                {doc.case && (
                  <Link
                    href={`/dashboard/cases/${doc.case.id}`}
                    className="flex items-center gap-1.5 text-xs text-brand-700 hover:underline"
                  >
                    <Briefcase className="size-3.5" />
                    <span className="font-mono">{doc.case.caseNumber}</span>
                  </Link>
                )}

                <p className="text-xs text-slate-500">
                  أُضيف {formatDate(doc.createdAt)}
                </p>

                <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
                    >
                      <ExternalLink className="size-4" />
                      معاينة
                    </a>
                    <a
                      href={doc.fileUrl}
                      download={doc.name}
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                    >
                      <Download className="size-4" />
                      تحميل
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="حذف"
                    onClick={() => setConfirmId(doc.id)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            );
          })}
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

      <AddDocumentDialog open={addOpen} onOpenChange={setAddOpen} />

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="حذف المستند"
        description="هل أنت متأكد من حذف هذا المستند؟ سيتم حذف السجل فقط — الملف الأصلي لا يُحذف."
        confirmText="حذف"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
