"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  HIJRI_MONTHS,
  gregorianToHijri,
  hijriToGregorian,
  gregorianISO,
  formatGregorianShort,
  isValidHijriParts,
  todayHijri,
} from "@/lib/hijri";

export interface HijriDateValue {
  /** التاريخ الميلادي بصيغة YYYY-MM-DD (UTC) — يُحفظ في قاعدة البيانات */
  gregorian: string | null;
  /** التاريخ الهجري بصيغة YYYY-MM-DD */
  hijri: string | null;
}

interface HijriDatePickerProps {
  /** القيمة الحالية كتاريخ ميلادي (ISO أو YYYY-MM-DD) */
  value?: string | null;
  onChange: (val: HijriDateValue) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * مُدخل تاريخ هجري: سنة/شهر/يوم بتقويم أم القرى، يحسب الميلادي تلقائياً
 * ويُخرج القيمتين معاً. يُستخدم داخل النماذج عبر Controller من react-hook-form.
 */
export function HijriDatePicker({
  value,
  onChange,
  id,
  disabled,
  className,
}: HijriDatePickerProps) {
  const parts = useMemo(() => {
    if (value) {
      try {
        return gregorianToHijri(value);
      } catch {
        /* تجاهل */
      }
    }
    return { hy: 0, hm: 0, hd: 0 };
  }, [value]);

  const { hy, hm, hd } = parts;

  const years = useMemo(() => {
    const current = todayHijri().hy;
    const list: number[] = [];
    // نطاق معقول: من 30 سنة قبل إلى 10 سنوات بعد السنة الحالية
    for (let y = current + 10; y >= current - 40; y--) list.push(y);
    return list;
  }, []);

  function emit(nextY: number, nextM: number, nextD: number) {
    if (nextY && nextM && nextD && isValidHijriParts(nextY, nextM, nextD)) {
      const g = hijriToGregorian(nextY, nextM, nextD);
      onChange({
        gregorian: gregorianISO(g),
        hijri: `${nextY}-${pad(nextM)}-${pad(nextD)}`,
      });
    } else {
      onChange({ gregorian: null, hijri: null });
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-3 gap-2" id={id}>
        <div>
          <Select
            aria-label="السنة الهجرية"
            value={hy || ""}
            disabled={disabled}
            onChange={(e) => emit(Number(e.target.value), hm, hd)}
          >
            <option value="">السنة</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Select
            aria-label="الشهر الهجري"
            value={hm || ""}
            disabled={disabled}
            onChange={(e) => emit(hy, Number(e.target.value), hd)}
          >
            <option value="">الشهر</option>
            {HIJRI_MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {i + 1} - {name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Select
            aria-label="اليوم الهجري"
            value={hd || ""}
            disabled={disabled}
            onChange={(e) => emit(hy, hm, Number(e.target.value))}
          >
            <option value="">اليوم</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <CalendarDays className="size-3.5 shrink-0" />
        {value ? (
          <span className="tabular-nums">
            الموافق ميلادي: {formatGregorianShort(value)}
          </span>
        ) : (
          <span>اختر السنة والشهر واليوم الهجري لحساب التاريخ الميلادي</span>
        )}
      </div>
      {/* حقل مخفي بالميلادي لدعم الإرسال المباشر عند اللزوم */}
      <Input type="hidden" value={value ?? ""} readOnly />
    </div>
  );
}
