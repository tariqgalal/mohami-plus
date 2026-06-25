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
  Scale,
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
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-admin-sidebar-gradient text-slate-100 border-l border-white/5">
      <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5">
        <span className="size-11 rounded-xl bg-admin-gold-gradient grid place-items-center text-white font-bold text-xl shadow-gold ring-1 ring-amber-400/40">
          <Scale className="size-6" strokeWidth={2.4} />
        </span>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight bg-gradient-to-l from-amber-300 to-amber-500 bg-clip-text text-transparent">
            {APP_NAME}
          </div>
          <div className="text-xs text-amber-400/80 mt-0.5">لوحة المنصة</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
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
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ease-out",
                active
                  ? "bg-admin-gold-gradient text-white shadow-gold ring-1 ring-amber-400/40"
                  : "text-slate-300 hover:bg-white/5 hover:text-white hover:translate-x-[-2px]",
              )}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0 transition-transform duration-200",
                  active ? "scale-110" : "group-hover:scale-110",
                )}
              />
              <span>{item.label}</span>
              {active && (
                <span className="ms-auto size-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 ring-1 ring-white/5">
          <div className="size-10 rounded-full bg-admin-gold-gradient text-white grid place-items-center text-sm font-bold shrink-0 ring-2 ring-amber-300/30 shadow-gold">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-sm font-semibold text-white truncate">
              {userName}
            </div>
            <div className="text-xs text-amber-400/80 truncate mt-0.5">
              مدير المنصة
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-red-300 bg-red-500/10 hover:bg-red-500/90 hover:text-white ring-1 ring-red-500/20 hover:ring-red-400/50 transition-all duration-200"
        >
          <LogOut className="size-5 shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
