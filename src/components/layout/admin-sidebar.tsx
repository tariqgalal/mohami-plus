"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const ADMIN_NAV = [
  { href: "/admin", label: "النظرة العامة", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "المكاتب", icon: Building2 },
  { href: "/admin/subscriptions", label: "الاشتراكات", icon: CreditCard },
  { href: "/admin/revenue", label: "الإيرادات", icon: TrendingUp },
  { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings },
];

interface AdminSidebarProps {
  userName: string;
}

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-admin-sidebar-gradient text-slate-100 border-l border-slate-800/70">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800/70">
        <span className="size-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 grid place-items-center text-white font-bold text-lg shadow-md shadow-amber-600/40">
          م
        </span>
        <div className="leading-tight">
          <div className="text-base font-bold">{APP_NAME}</div>
          <div className="text-xs text-amber-400">لوحة المنصة</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                active
                  ? "bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white",
              )}
            >
              {active && (
                <span className="absolute inset-y-2 right-0 w-1 rounded-full bg-white/80" />
              )}
              <Icon className="size-5 shrink-0 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/70 p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/60">
          <div className="size-9 rounded-full bg-amber-600/30 text-amber-200 grid place-items-center text-sm font-semibold shrink-0 ring-2 ring-amber-500/30">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-sm font-medium text-white truncate">
              {userName}
            </div>
            <div className="text-xs text-amber-400 truncate">
              مدير المنصة
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="size-5 shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
