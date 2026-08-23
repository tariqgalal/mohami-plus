import { cn } from "@/lib/utils";
import { formatHijri, formatGregorianShort } from "@/lib/hijri";

interface DualDateDisplayProps {
  date: Date | string | null | undefined;
  className?: string;
  /** إظهار كلمة "هـ" بجانب التاريخ الهجري */
  showSuffix?: boolean;
}

/**
 * يعرض التاريخ الهجري (أعلى) والميلادي (أسفل) — مثل: 1448-02-08 / 2026-07-22.
 */
export function DualDateDisplay({
  date,
  className,
  showSuffix = true,
}: DualDateDisplayProps) {
  if (!date) return <span className="text-slate-400">—</span>;
  return (
    <div className={cn("leading-tight", className)}>
      <div className="text-sm text-slate-900 tabular-nums">
        {formatHijri(date)}
        {showSuffix && <span className="text-xs text-slate-400"> هـ</span>}
      </div>
      <div className="text-xs text-slate-500 tabular-nums">
        {formatGregorianShort(date)}
      </div>
    </div>
  );
}
