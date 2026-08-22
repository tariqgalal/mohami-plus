"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Link2, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload, type UploadedFileInfo } from "@/components/shared/file-upload";
import { toast } from "@/store/toast-store";

interface Owner {
  caseId?: string;
  clientId?: string;
  invoiceId?: string;
  sessionId?: string;
  meetingId?: string;
}

interface AttachmentRecord {
  id: string;
  type: "UPLOAD" | "LINK";
  fileName: string | null;
  url: string | null;
  label: string | null;
  storagePath: string | null;
  createdAt: string;
}

interface Props {
  owner: Owner;
  title?: string;
  uploadAccept?: string;
  uploadHint?: string;
}

function ownerKey(o: Owner) {
  return JSON.stringify(o);
}

function ownerQuery(o: Owner) {
  return new URLSearchParams(
    Object.fromEntries(
      Object.entries(o).filter(([, v]) => Boolean(v)),
    ) as Record<string, string>,
  ).toString();
}

export function AttachmentInput({
  owner,
  title = "المرفقات",
  uploadAccept,
  uploadHint,
}: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"upload" | "link">("upload");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [pendingUpload, setPendingUpload] = useState<UploadedFileInfo | null>(
    null,
  );

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["attachments", ownerKey(owner)],
    queryFn: async () => {
      const res = await fetch(`/api/attachments?${ownerQuery(owner)}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data as AttachmentRecord[];
    },
    enabled: Object.values(owner).some(Boolean),
  });

  const addLinkMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...owner,
          url: linkUrl,
          label: linkLabel || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", ownerKey(owner)] });
      setLinkUrl("");
      setLinkLabel("");
      toast.success("تمت إضافة الرابط");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "فشل إضافة الرابط";
      toast.error(msg);
    },
  });

  const removeMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", ownerKey(owner)] });
      toast.success("تم الحذف");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "فشل الحذف";
      toast.error(msg);
    },
  });

  // Auto-persist newly uploaded file once it lands in pendingUpload.
  // We rely on the upload API (POST /api/upload) returning info; here we
  // also persist a LINK-style attachment record pointing to the upload's URL.
  // This keeps the unified attachments list always accurate.
  useEffect(() => {
    if (!pendingUpload) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...owner,
            // For Supabase-backed uploads URL is a signed URL; we store the URL
            // as a LINK record (no need for storagePath tracking on this MVP).
            url: pendingUpload.url,
            label: pendingUpload.name,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);
        if (!cancelled) {
          qc.invalidateQueries({ queryKey: ["attachments", ownerKey(owner)] });
          setPendingUpload(null);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "فشل حفظ المرفق";
        if (!cancelled) toast.error(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingUpload, owner, qc]);

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      )}

      {/* Tabs */}
      <div className="inline-flex rounded-md border border-slate-200 p-1 bg-slate-50">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`px-3 py-1.5 text-xs rounded-sm transition ${
            tab === "upload"
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="size-3.5 inline ms-1" />
          رفع ملف
        </button>
        <button
          type="button"
          onClick={() => setTab("link")}
          className={`px-3 py-1.5 text-xs rounded-sm transition ${
            tab === "link"
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Link2 className="size-3.5 inline ms-1" />
          إضافة رابط
        </button>
      </div>

      {tab === "upload" && (
        <FileUpload
          value={null}
          onChange={(f) => f && setPendingUpload(f)}
          accept={uploadAccept}
          hint={uploadHint}
        />
      )}

      {tab === "link" && (
        <div className="space-y-3 rounded-md border border-slate-200 p-3 bg-slate-50">
          <div className="space-y-2">
            <Label htmlFor="att-url">رابط الملف *</Label>
            <Input
              id="att-url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="att-label">الوصف (اختياري)</Label>
            <Input
              id="att-label"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="مثال: صورة عقد الإيجار من Google Drive"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => addLinkMut.mutate()}
              loading={addLinkMut.isPending}
              disabled={!linkUrl.trim()}
            >
              <Plus className="size-4" />
              إضافة
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-slate-500">جاري التحميل...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد مرفقات بعد.</p>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 p-2 rounded-md border border-slate-200 bg-white"
            >
              {a.type === "UPLOAD" ? (
                <FileText className="size-4 text-slate-400 shrink-0" />
              ) : (
                <Link2 className="size-4 text-brand-600 shrink-0" />
              )}
              <a
                href={a.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-sm text-slate-900 hover:text-brand-700 truncate"
              >
                {a.label || a.fileName || a.url || "(بدون اسم)"}
              </a>
              {a.type === "LINK" && (
                <ExternalLink className="size-3.5 text-slate-400" />
              )}
              <button
                type="button"
                disabled
                className="text-slate-400 hover:text-red-600 p-1"
                aria-label="الحذف غير متاح"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
