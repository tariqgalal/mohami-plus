"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionListItem } from "@/hooks/use-sessions";

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

interface SessionCalendarProps {
  sessions: SessionListItem[];
  month: Date;
  onMonthChange: (m: Date) => void;
}

export function SessionCalendar({
  sessions,
  month,
  onMonthChange,
}: SessionCalendarProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstOfMonth = new Date(year, monthIdx, 1);
  const lastOfMonth = new Date(year, monthIdx + 1, 0);
  const startWeekDay = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastOfMonth.getDate();

  // بناء grid يبدأ بأيام فاضية لمحاذاة بداية الشهر
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIdx, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // تجميع الجلسات حسب التاريخ (YYYY-MM-DD)
  const sessionsByDay = new Map<string, SessionListItem[]>();
  sessions.forEach((s) => {
    const key = new Date(s.date).toISOString().slice(0, 10);
    const arr = sessionsByDay.get(key) ?? [];
    arr.push(s);
    sessionsByDay.set(key, arr);
  });

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  function prev() {
    onMonthChange(new Date(year, monthIdx - 1, 1));
  }
  function next() {
    onMonthChange(new Date(year, monthIdx + 1, 1));
  }
  function goToday() {
    onMonthChange(new Date());
    setSelected(todayKey);
  }

  const selectedSessions = selected ? sessionsByDay.get(selected) ?? [] : [];

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prev}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={next}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday}>
              اليوم
            </Button>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {MONTHS[monthIdx]} {year}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-md overflow-hidden border border-slate-200">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="bg-slate-50 text-center py-2 text-xs font-medium text-slate-500"
            >
              {wd}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="bg-white min-h-20" />;
            const key = d.toISOString().slice(0, 10);
            const dayList = sessionsByDay.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(isSelected ? null : key)}
                className={cn(
                  "bg-white min-h-20 p-1.5 text-right hover:bg-slate-50 transition-colors flex flex-col items-stretch",
                  isSelected && "ring-2 ring-brand-500 ring-inset",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday
                      ? "size-6 rounded-full bg-brand-600 text-white grid place-items-center ms-auto"
                      : "text-slate-700 self-end",
                  )}
                >
                  {d.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayList.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className="text-[10px] bg-brand-50 text-brand-700 rounded px-1 py-0.5 truncate"
                    >
                      {s.time} · {s.case.caseNumber}
                    </div>
                  ))}
                  {dayList.length > 2 && (
                    <div className="text-[10px] text-slate-500 ps-1">
                      +{dayList.length - 2} المزيد
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 max-h-[600px] overflow-y-auto">
        <h4 className="font-semibold text-slate-900 mb-3 text-sm border-b border-slate-100 pb-2">
          {selected
            ? `جلسات يوم ${new Date(selected).getDate()} ${MONTHS[new Date(selected).getMonth()]}`
            : "اختر يوماً لعرض جلساته"}
        </h4>
        {selectedSessions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            {selected ? "لا توجد جلسات في هذا اليوم" : "—"}
          </p>
        ) : (
          <div className="space-y-2">
            {selectedSessions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/sessions/${s.id}`}
                className="block p-3 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-slate-900 tabular-nums">
                    {s.time}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {s.case.caseNumber}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {s.case.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {s.court}
                  {s.hall ? ` · ${s.hall}` : ""}
                </p>
                <p className="text-xs text-slate-500">{s.lawyer.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
