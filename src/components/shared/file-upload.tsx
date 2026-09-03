"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/store/toast-store";
import { apiErrorMessage } from "@/lib/api-error-message";

export interface UploadedFileInfo {
  url: string;
  name: string;
  size: number;
  type: string;
  mime: string | null;
}

interface FileUploadProps {
  value?: UploadedFileInfo | null;
  onChange: (file: UploadedFileInfo | null) => void;
  accept?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isImage(type: string): boolean {
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(
    type.toLowerCase(),
  );
}

export function FileUpload({
  value,
  onChange,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif",
  label = "اختر ملفاً",
  hint = "PDF, DOCX, JPG, PNG (حد أقصى 10MB)",
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (file.size === 0) {
      toast.error("الملف فارغ");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف يتجاوز 10 ميجابايت");
      return;
    }
    // فحص مبكر للامتداد حتى لا ينتظر المستخدم رفعاً سيفشل على السيرفر
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const allowed = accept
      .split(",")
      .map((a) => a.trim().replace(/^\./, "").toLowerCase())
      .filter(Boolean);
    if (allowed.length && !allowed.includes(ext)) {
      toast.error(`نوع الملف غير مدعوم. المسموح: ${allowed.join("، ")}`);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(apiErrorMessage(json));
      }
      onChange(json.data as UploadedFileInfo);
      toast.success("تم رفع الملف");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "فشل رفع الملف";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex size-10 items-center justify-center rounded bg-white text-slate-500">
          {isImage(value.type) ? (
            <ImageIcon className="size-5" />
          ) : (
            <FileText className="size-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <a
            href={value.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm font-medium text-slate-700 hover:text-brand-600 hover:underline"
          >
            {value.name}
          </a>
          <p className="text-xs text-slate-500">
            {formatBytes(value.size)} · {value.type.toUpperCase()}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          disabled={disabled || uploading}
          aria-label="إزالة الملف"
        >
          <X className="size-4 text-red-500" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            جاري الرفع...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            {label}
          </>
        )}
      </button>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
