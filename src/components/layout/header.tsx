"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ListChecks, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { USER_ROLES } from "@/lib/constants";
import type { UserRole } from "@prisma/client";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";
import { GlobalSearch } from "./global-search";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: UserRole;
  };
  tenantName?: string;
  todayTasksCount?: number;
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "الرئيسية",
  cases: "القضايا",
  sessions: "الجلسات",
  clients: "العملاء",
  team: "الفريق",
  meetings: "الاجتماعات",
  finance: "المالية",
  invoices: "الفواتير",
  documents: "المستندات",
  reports: "التقارير",
  notifications: "الإشعارات",
  najiz: "ناجز",
  settings: "الإعدادات",
  new: "إضافة جديدة",
  edit: "تعديل",
  profile: "الملف الشخصي",
};

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const items: { label: string; href: string }[] = [];
  let acc = "";
  for (const seg of parts) {
    acc += `/${seg}`;
    const label =
      SEGMENT_LABELS[seg] ??
      (seg.length > 16 ? `${seg.slice(0, 8)}...` : seg);
    items.push({ label, href: acc });
  }
  return items;
}

export function Header({ user, tenantName, todayTasksCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "الرئيسية";

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav />
        <div className="hidden md:block min-w-0">
          <h2 className="text-sm font-bold text-slate-900 truncate">
            {pageTitle}
          </h2>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5"
          >
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={i} className="flex items-center gap-1">
                  {isLast ? (
                    <span className="text-slate-700">{c.label}</span>
                  ) : (
                    <Link href={c.href} className="hover:text-brand-600">
                      {c.label}
                    </Link>
                  )}
                  {!isLast && (
                    <ChevronLeft className="size-3 text-slate-300" />
                  )}
                </span>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        {todayTasksCount > 0 && (
          <Link
            href="/dashboard"
            className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm transition-colors"
            title="مهام اليوم"
          >
            <ListChecks className="size-4" />
            <span className="tabular-nums font-semibold">
              {todayTasksCount}
            </span>
            <span className="hidden lg:inline">مهام اليوم</span>
          </Link>
        )}

        {tenantName && (
          <span className="hidden xl:inline text-sm text-slate-500 px-2">
            {tenantName}
          </span>
        )}

        <NotificationBell />

        <div className="flex items-center gap-2 ps-2 border-s border-slate-200">
          <div className="size-9 rounded-full bg-brand-gradient text-white grid place-items-center text-sm font-semibold shadow-sm">
            {getInitials(user.name || user.email || "؟")}
          </div>
          <div className="hidden md:block text-sm leading-tight">
            <div className="font-medium text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500">{USER_ROLES[user.role]}</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="تسجيل الخروج"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-5" />
        </Button>
      </div>
    </header>
  );
}
