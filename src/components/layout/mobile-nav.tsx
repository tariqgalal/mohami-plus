"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
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
  Landmark,
  ShieldCheck,
  Headphones,
  Mail,
  Inbox,
  Users2,
  Globe,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/dashboard/cases", label: "القضايا", icon: Briefcase },
  { href: "/dashboard/sessions", label: "الجلسات", icon: Gavel },
  { href: "/dashboard/clients", label: "العملاء", icon: Users },
  { href: "/dashboard/client-requests", label: "طلبات خدمات العملاء", icon: Headphones },
  { href: "/dashboard/correspondence/clients", label: "مراسلات العملاء", icon: Mail },
  { href: "/dashboard/correspondence/employees", label: "مراسلات الموظفين", icon: Mail },
  { href: "/dashboard/transactions/incoming", label: "المعاملات — الوارد", icon: Inbox },
  { href: "/dashboard/transactions/outgoing", label: "المعاملات — الصادر", icon: Inbox },
  { href: "/dashboard/powers-of-attorney", label: "الوكالات", icon: ShieldCheck },
  { href: "/dashboard/team", label: "الفريق", icon: UserCog },
  { href: "/dashboard/hr/leaves", label: "سجل الإجازات", icon: Users2 },
  { href: "/dashboard/hr/leave-reports", label: "تقارير إجازات الموظفين", icon: Users2 },
  { href: "/dashboard/meetings", label: "الاجتماعات", icon: CalendarDays },
  { href: "/dashboard/finance", label: "المالية", icon: Wallet },
  { href: "/dashboard/documents", label: "المستندات", icon: FileText },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/dashboard/najiz", label: "ناجز", icon: Landmark },
  { href: "/dashboard/wathiq", label: "واجهة وثائق", icon: Globe },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu className="size-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-sidebar-gradient text-slate-100 flex flex-col animate-in slide-in-from-top-2">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="size-9 rounded-lg bg-brand-gradient grid place-items-center text-white font-bold text-lg shadow-md shadow-brand-600/40">
                  م
                </span>
                <span className="text-lg font-bold">{APP_NAME}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-slate-300 hover:bg-slate-800"
                aria-label="إغلاق"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                      active
                        ? "bg-brand-gradient text-white shadow-md shadow-brand-600/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-800 p-3">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
              >
                <LogOut className="size-5 shrink-0" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
