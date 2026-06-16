import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  Gavel,
  Wallet,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listUserNotifications } from "@/services/notification-service";
import { formatRelativeTime } from "@/lib/format";
import { MarkAllReadButton } from "./mark-all-read-button";

export const metadata: Metadata = {
  title: "الإشعارات",
};

const TYPE_STYLES: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  SESSION_REMINDER: { icon: Gavel, color: "bg-amber-50 text-amber-600", label: "تذكير جلسة" },
  SESSION_CREATED: { icon: Gavel, color: "bg-amber-50 text-amber-600", label: "جلسة جديدة" },
  CASE_ASSIGNED: { icon: Briefcase, color: "bg-blue-50 text-blue-600", label: "قضية جديدة" },
  CASE_UPDATED: { icon: Briefcase, color: "bg-violet-50 text-violet-600", label: "تحديث قضية" },
  INVOICE_OVERDUE: { icon: Wallet, color: "bg-rose-50 text-rose-600", label: "فاتورة متأخرة" },
  GENERAL: { icon: Sparkles, color: "bg-slate-50 text-slate-600", label: "عام" },
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

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const items = await listUserNotifications(session.user.id, { limit: 100 });

  return (
    <div className="space-y-6 animate-fade-in-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الإشعارات</h1>
          <p className="text-slate-500 mt-1">
            كل الإشعارات والتنبيهات الخاصة بك
          </p>
        </div>
        <MarkAllReadButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {items.length} إشعار
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="size-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">لا توجد إشعارات بعد</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.GENERAL;
                const Icon = style.icon;
                const link = parseLink(n.data);
                const body = (
                  <div
                    className={`px-6 py-4 flex items-start gap-4 transition-colors hover:bg-slate-50 ${!n.isRead ? "bg-brand-50/30" : ""}`}
                  >
                    <div
                      className={`size-11 rounded-xl grid place-items-center shrink-0 ${style.color}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{n.title}</p>
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
                  </div>
                );
                return (
                  <li key={n.id}>
                    {link ? <Link href={link}>{body}</Link> : body}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
