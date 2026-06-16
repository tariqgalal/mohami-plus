"use client";

import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/store/toast-store";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
};

const STYLES: Record<ToastVariant, string> = {
  default: "bg-white border-slate-200 text-slate-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  error: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
};

const ICON_COLORS: Record<ToastVariant, string> = {
  default: "text-slate-500",
  success: "text-emerald-600",
  error: "text-red-600",
  warning: "text-amber-600",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed top-4 left-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-top-2",
              STYLES[t.variant],
            )}
            role="status"
          >
            <Icon className={cn("size-5 shrink-0 mt-0.5", ICON_COLORS[t.variant])} />
            <div className="flex-1 text-sm">
              {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
              <div>{t.description}</div>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
