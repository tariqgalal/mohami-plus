"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Gavel,
  CalendarDays,
  Wallet,
  Check,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TodayTask {
  id: string;
  kind: "session" | "meeting" | "invoice";
  title: string;
  meta: string;
  href: string;
}

const KIND_STYLES: Record<
  TodayTask["kind"],
  { icon: typeof Gavel; color: string; label: string }
> = {
  session: { icon: Gavel, color: "bg-amber-50 text-amber-600", label: "جلسة" },
  meeting: {
    icon: CalendarDays,
    color: "bg-blue-50 text-blue-600",
    label: "اجتماع",
  },
  invoice: {
    icon: Wallet,
    color: "bg-rose-50 text-rose-600",
    label: "فاتورة",
  },
};

const STORAGE_KEY = "mp:today-tasks-done";

function loadDone(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const today = new Date().toDateString();
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === today) filtered[k] = v;
    }
    return filtered;
  } catch {
    return {};
  }
}

function saveDone(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function TodayTasksWidget({ tasks }: { tasks: TodayTask[] }) {
  const [done, setDone] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDone(loadDone());
    setHydrated(true);
  }, []);

  function toggle(id: string) {
    const today = new Date().toDateString();
    setDone((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = today;
      }
      saveDone(next);
      return next;
    });
  }

  const remaining = tasks.filter((t) => !done[t.id]).length;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm text-slate-500">لا توجد مهام لليوم 🎉</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">
          {hydrated
            ? remaining === 0
              ? "أنجزت كل مهام اليوم 🎉"
              : `${remaining} من ${tasks.length} مهمة متبقية`
            : `${tasks.length} مهمة لليوم`}
        </p>
        {hydrated && tasks.length > 0 && (
          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all"
              style={{
                width: `${Math.round(((tasks.length - remaining) / tasks.length) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => {
          const style = KIND_STYLES[t.kind];
          const Icon = style.icon;
          const isDone = hydrated && Boolean(done[t.id]);
          return (
            <li
              key={`${t.kind}-${t.id}`}
              className={cn(
                "flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 transition-all",
                isDone
                  ? "bg-slate-50 opacity-60"
                  : "bg-white hover:border-brand-200 hover:shadow-sm",
              )}
            >
              <button
                onClick={() => toggle(t.id)}
                aria-label={isDone ? "إلغاء" : "تم"}
                className={cn(
                  "size-6 rounded-md border grid place-items-center shrink-0 mt-0.5 transition-colors",
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-300 hover:border-emerald-400",
                )}
              >
                {isDone && <Check className="size-3.5" />}
              </button>
              <div
                className={cn(
                  "size-8 rounded-md grid place-items-center shrink-0",
                  style.color,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={t.href}
                  className={cn(
                    "block text-sm font-medium truncate hover:text-brand-600",
                    isDone ? "line-through text-slate-500" : "text-slate-900",
                  )}
                >
                  {t.title}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">{t.meta}</p>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                {style.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
