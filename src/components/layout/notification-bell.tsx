"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { notificationStyle } from "./notification-styles";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string | Date;
}

/** فاصل تحديث عدّاد غير المقروء */
const POLL_MS = 30_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // polling خفيف: العدّاد فقط
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) setUnread(json.data.count);
    } catch {
      // تجاهل — سيُعاد المحاولة في الدورة التالية
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20", {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setUnread(json.data.unreadCount);
      }
    } catch {
      // تجاهل
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUnreadCount();
    const id = window.setInterval(fetchUnreadCount, POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void fetchNotifications();
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, fetchNotifications]);

  async function markOneRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // تجاهل
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch {
      // تجاهل
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
                {unread > 0 ? `${unread} إشعار غير مقروء` : "كل شيء على ما يرام"}
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
                  const style = notificationStyle(n.type);
                  const Icon = style.icon;
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
                      {n.link ? (
                        <Link href={n.link} onClick={() => setOpen(false)}>
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
