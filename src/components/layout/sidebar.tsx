"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Gavel,
  Users,
  UserCog,
  CalendarDays,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Landmark,
  CreditCard,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { APP_NAME, USER_ROLES } from "@/lib/constants";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

const NAV: Array<{ href: string; label: string; icon: typeof LayoutDashboard; permission?: Permission }> = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/dashboard/cases", label: "القضايا", icon: Briefcase },
  { href: "/dashboard/sessions", label: "الجلسات", icon: Gavel },
  { href: "/dashboard/clients", label: "العملاء", icon: Users },
  { href: "/dashboard/client-requests", label: "طلبات خدمات العملاء", icon: Headphones, permission: "SERVICE_REQUEST_READ" },
  { href: "/dashboard/powers-of-attorney", label: "الوكالات", icon: ShieldCheck, permission: "POA_READ" },
  { href: "/dashboard/team", label: "الفريق", icon: UserCog, permission: "TEAM_READ" },
  { href: "/dashboard/meetings", label: "الاجتماعات", icon: CalendarDays },
  { href: "/dashboard/finance", label: "المالية", icon: Wallet, permission: "FINANCE_READ" },
  { href: "/dashboard/documents", label: "المستندات", icon: FileText },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3, permission: "REPORTS_READ" },
  { href: "/dashboard/najiz", label: "ناجز", icon: Landmark },
  { href: "/dashboard/billing", label: "الاشتراك والفوترة", icon: CreditCard, permission: "BILLING_MANAGE" },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar-gradient text-slate-100 border-l border-slate-800/70">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800/70">
        <span className="size-9 rounded-lg bg-brand-gradient grid place-items-center text-white font-bold text-lg shadow-md shadow-brand-600/40">
          م
        </span>
        <span className="text-lg font-bold">{APP_NAME}</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.filter((item) => !item.permission || (user && hasPermission(user.role as UserRole, item.permission))).map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                active
                  ? "bg-brand-gradient text-white shadow-md shadow-brand-600/30"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white hover:translate-x-[-2px]",
              )}
            >
              {active && (
                <span className="absolute inset-y-2 right-0 w-1 rounded-full bg-white/80" />
              )}
              <Icon
                className={cn(
                  "size-5 shrink-0 transition-transform",
                  active ? "" : "group-hover:scale-110",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/70 p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/60">
            <div className="size-9 rounded-full bg-brand-600/30 text-brand-200 grid place-items-center text-sm font-semibold shrink-0 ring-2 ring-brand-500/30">
              {getInitials(user.name || user.email || "؟")}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-sm font-medium text-white truncate">
                {user.name}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {USER_ROLES[user.role as UserRole]}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="size-5 shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
        <div className="text-[10px] text-slate-500 px-3 pt-1">
          إصدار 0.1.0
        </div>
      </div>
    </aside>
  );
}
