"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { notificationStyle } from "@/components/layout/notification-styles";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const LIMIT = 20;

export function NotificationsClient() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        page: String(page),
      });
      if (unreadOnly) params.set("unreadOnly", "true");

      const res = await fetch(`/api/notifications?${params}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setTotal(json.data.total);
        setTotalPages(json.data.totalPages);
        setUnreadCount(json.data.unreadCount);
      }
    } catch {
      // تجاهل — الحالة الفارغة تظهر للمستخدم
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  function changeFilter(next: boolean) {
    setUnreadOnly(next);
    setPage(1);
  }

  async function markAllRead() {
    setMarking(true);
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      await load();
    } finally {
      setMarking(false);
    }
  }

  async function openNotification(n: NotificationItem) {
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
      } catch {
        // تجاهل
      }
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => changeFilter(false)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-colors",
              !unreadOnly
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            الكل
          </button>
          <button
            onClick={() => changeFilter(true)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-colors",
              unreadOnly
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            غير مقروءة
            {unreadCount > 0 && (
              <span
                className={cn(
                  "ms-2 text-[11px] px-1.5 py-0.5 rounded-full",
                  unreadOnly
                    ? "bg-white/25 text-white"
                    : "bg-red-50 text-red-600",
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <Button
          onClick={markAllRead}
          loading={marking}
          disabled={unreadCount === 0}
          variant="outline"
          size="sm"
        >
          <CheckCheck className="size-4" />
          تعليم الكل كمقروء
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 grid place-items-center text-slate-400">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center">
              <Bell className="size-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                {unreadOnly
                  ? "لا توجد إشعارات غير مقروءة"
                  : "لا توجد إشعارات بعد"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const style = notificationStyle(n.type);
                const Icon = style.icon;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={cn(
                        "w-full text-right px-6 py-4 flex items-start gap-4 transition-colors hover:bg-slate-50",
                        !n.isRead && "bg-brand-50/30",
                      )}
                    >
                      <div
                        className={cn(
                          "size-11 rounded-xl grid place-items-center shrink-0",
                          style.color,
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">
                            {n.title}
                          </p>
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {style.label}
                          </span>
                          {!n.isRead && (
                            <span className="size-2 rounded-full bg-brand-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{n.body}</p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPageChange={setPage}
      />
    </div>
  );
}
