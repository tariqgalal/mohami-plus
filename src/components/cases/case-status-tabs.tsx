"use client";

import { cn } from "@/lib/utils";
import { CASE_STATUS } from "@/lib/constants";

interface CaseStatusTabsProps {
  value?: string;
  counts: Record<string, number>;
  total: number;
  onChange: (status: string | undefined) => void;
}

// ترتيب عرض تبويبات الحالات. كل مفتاح هنا لازم يكون موجوداً في CASE_STATUS
// مرة واحدة فقط — التكرار كان سبب ظهور تبويب "معلقة" مرتين.
const PRIMARY_ORDER = [
  "OPEN",
  "IN_PROGRESS",
  "PENDING",
  "PRE_FILING",
  "ON_HOLD",
  "APPEALED",
  "WON",
  "LOST",
  "SETTLED",
  "CLOSED",
];

export function CaseStatusTabs({
  value,
  counts,
  total,
  onChange,
}: CaseStatusTabsProps) {
  // نحذف أي مفتاح غير معرّف، وأي تسمية مكرّرة (احتياط ضد رجوع التكرار).
  const seenLabels = new Set<string>();
  const statuses = PRIMARY_ORDER.filter((k) => {
    if (!(k in CASE_STATUS)) return false;
    const label = (CASE_STATUS as Record<string, string>)[k];
    if (seenLabels.has(label)) return false;
    seenLabels.add(label);
    return true;
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
      <Tab
        label="الكل"
        count={total}
        active={!value}
        onClick={() => onChange(undefined)}
      />
      {statuses.map((k) => (
        <Tab
          key={k}
          label={(CASE_STATUS as Record<string, string>)[k]}
          count={counts[k] ?? 0}
          active={value === k}
          onClick={() => onChange(k)}
        />
      ))}
    </div>
  );
}

function Tab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-xs tabular-nums",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
        )}
      >
        {count}
      </span>
    </button>
  );
}
