"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  Gavel,
  Wallet,
  Sparkles,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  data: string | null;
  createdAt: string | Date;
}

const TYPE_STYLES: Record<string, { icon: typeof Bell; color: string }> = {
  SESSION_REMINDER: { icon: Gavel, color: "bg-amber-50 text-amber-600" },
  SESSION_CREATED: { icon: Gavel, color: "bg-amber-50 text-amber-600" },
  CASE_ASSIGNED: { icon: Briefcase, color: "bg-blue-50 text-blue-600" },
  CASE_UPDATED: { icon: Briefcase, color: "bg-violet-50 text-violet-600" },
  INVOICE_OVERDUE: { icon: Wallet, color: "bg-rose-50 text-rose-600" },
  GENERAL: { icon: Sparkles, color: "bg-slate-50 text-slate-600" },
};

function parseLink(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    return typeof d?.link === "string" ? d.link : null;
  } catch {
    return null;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setUnread(json.data.unreadCount);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications(true);
    const id = window.setInterval(() => fetchNotifications(true), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchNotifications();
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markOneRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch(`/api/notifications/${id}`, { method: "PUT" });
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await fetch("/api/notifications", { method: "PUT" });
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="الإشعارات"
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold grid place-items-center ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-[360px] max-w-[92vw] rounded-xl border border-slate-200 bg-white shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900">الإشعارات</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {unread > 0
                  ? `${unread} إشعار غير مقروء`
                  : "كل شيء على ما يرام"}
              </p>
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1"
              >
                <CheckCheck className="size-3.5" />
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="py-12 grid place-items-center text-slate-400">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                <Bell className="size-8 mx-auto mb-2 text-slate-300" />
                لا توجد إشعارات
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.GENERAL;
                  const Icon = style.icon;
                  const link = parseLink(n.data);
                  const content = (
                    <div
                      className={cn(
                        "px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 cursor-pointer",
                        !n.isRead && "bg-brand-50/40",
                      )}
                      onClick={() => !n.isRead && markOneRead(n.id)}
                    >
                      <div
                        className={cn(
                          "size-9 rounded-lg grid place-items-center shrink-0",
                          style.color,
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                          {n.body}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="size-2 rounded-full bg-brand-500 mt-2 shrink-0" />
                      )}
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {link ? (
                        <Link href={link} onClick={() => setOpen(false)}>
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="border-t border-slate-100 px-4 py-2.5 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-sm text-brand-600 hover:underline font-medium"
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
