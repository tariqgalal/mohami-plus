"use client";

import { useState } from "react";
import Link from "next/link";
import { Gavel, AlertCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface SessionItem {
  id: string;
  date: Date | string;
  time: string;
  court: string;
  case: { id: string; caseNumber: string; title: string };
  lawyer: { id: string; name: string };
}

export function SessionsWidget({
  upcoming,
  today,
}: {
  upcoming: SessionItem[];
  today: SessionItem[];
}) {
  const [tab, setTab] = useState<"upcoming" | "today">("upcoming");
  const list = tab === "today" ? today : upcoming;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-sm">
        <TabButton
          active={tab === "upcoming"}
          onClick={() => setTab("upcoming")}
          label="القادمة"
        />
        <TabButton
          active={tab === "today"}
          onClick={() => setTab("today")}
          label={`اليوم (${today.length})`}
        />
      </div>

      {list.length === 0 ? (
        <div className="flex items-start gap-2 rounded-md bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>
            {tab === "today"
              ? "لا توجد جلسات اليوم"
              : "لا توجد جلسات مجدولة"}
          </span>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {list.map((s) => (
            <li key={s.id} className="py-3 flex items-start gap-3">
              <div className="size-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                <Gavel className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/sessions/${s.id}`}
                  className="font-medium text-slate-900 truncate block hover:text-brand-600"
                >
                  {s.case.title}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(s.date)} · {s.time} · {s.court}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {s.case.caseNumber} · {s.lawyer.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/dashboard/sessions"
        className="text-xs text-brand-600 hover:underline flex items-center gap-0.5"
      >
        عرض كل الجلسات
        <ChevronLeft className="size-3" />
      </Link>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md px-3 py-1.5 transition-colors",
        active
          ? "bg-white text-brand-700 shadow-sm font-medium"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {label}
    </button>
  );
}
