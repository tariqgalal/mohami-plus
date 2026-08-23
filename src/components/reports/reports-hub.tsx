"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  Users,
  Receipt,
  CalendarClock,
  BookOpen,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportRow {
  label: string;
  href?: string;
  soon?: boolean;
  note?: string;
}

interface ReportCategory {
  key: string;
  title: string;
  icon: typeof Users;
  rows: ReportRow[];
}

const CATEGORIES: ReportCategory[] = [
  {
    key: "client",
    title: "تقارير القوائم لعميل محدد",
    icon: Users,
    rows: [
      {
        label: "تقرير مشاريع العميل",
        soon: true,
        note: "يعتمد على وحدة المشاريع",
      },
    ],
  },
  {
    key: "vat",
    title: "تقارير القيمة المضافة",
    icon: Receipt,
    rows: [
      {
        label: "تقرير ضريبة القيمة المضافة",
        soon: true,
        note: "يعتمد على وحدة المحاسبة",
      },
    ],
  },
  {
    key: "appointments",
    title: "تقارير المواعيد",
    icon: CalendarClock,
    rows: [
      { label: "تقرير المواعيد", href: "/dashboard/meetings" },
      {
        label: "تقرير طلبات العملاء خلال فترة زمنية",
        href: "/dashboard/client-requests",
      },
    ],
  },
  {
    key: "loans",
    title: "تقارير الاستعارات",
    icon: BookOpen,
    rows: [
      {
        label: "تقرير استعارات الموظف",
        soon: true,
        note: "يعتمد على وحدة الاستعارات",
      },
      {
        label: "تقرير استعارات (مشروع / عميل)",
        soon: true,
        note: "يعتمد على وحدة الاستعارات",
      },
    ],
  },
  {
    key: "transactions",
    title: "تقارير المعاملات",
    icon: Inbox,
    rows: [
      {
        label: "تقرير المعاملات الصادرة",
        href: "/dashboard/transactions/outgoing",
      },
      {
        label: "تقرير المعاملات الواردة",
        href: "/dashboard/transactions/incoming",
      },
    ],
  },
];

export function ReportsHub() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    appointments: true,
    transactions: true,
  });

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">
        مركز التقارير التفصيلية
      </h2>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isOpen = open[cat.key] ?? false;
        return (
          <Card key={cat.key} className="overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setOpen((o) => ({ ...o, [cat.key]: !o[cat.key] }))
              }
              className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-slate-50 transition-colors"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                <Icon className="size-5" />
              </span>
              <span className="flex-1 font-medium text-slate-800">
                {cat.title}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-slate-400 transition-transform",
                  isOpen ? "rotate-180" : "",
                )}
              />
            </button>
            {isOpen && (
              <ul className="border-t border-slate-100 divide-y divide-slate-100">
                {cat.rows.map((row) => (
                  <li key={row.label}>
                    {row.soon ? (
                      <div className="flex items-center gap-3 px-4 py-3 ps-16 text-slate-400">
                        <span className="flex-1 text-sm">{row.label}</span>
                        <Badge variant="secondary">قريباً</Badge>
                      </div>
                    ) : (
                      <Link
                        href={row.href!}
                        className="flex items-center gap-3 px-4 py-3 ps-16 text-slate-700 hover:bg-brand-50/40 transition-colors group"
                      >
                        <span className="flex-1 text-sm">{row.label}</span>
                        <ChevronLeft className="size-4 text-slate-400 group-hover:text-brand-600" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
