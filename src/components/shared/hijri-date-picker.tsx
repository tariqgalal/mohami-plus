"use client";

import { useEffect, useMemo, useState } from "react";
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
  formatHijri,
  isValidHijriParts,
  todayHijri,
} from "@/lib/hijri";

export interface HijriDateValue {
  /** التاريخ الميلادي بصيغة YYYY-MM-DD (UTC) — يُحفظ في قاعدة البيانات */
  gregorian: string | null;
  /** التاريخ الهجري بصيغة YYYY-MM-DD */
  hijri: string | null;
}

type CalendarMode = "hijri" | "gregorian";

interface HijriDatePickerProps {
  /** القيمة الحالية كتاريخ ميلادي (ISO أو YYYY-MM-DD) */
  value?: string | null;
  onChange: (val: HijriDateValue) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** التقويم المختار افتراضياً عند فتح النموذج (الافتراضي: هجري) */
  defaultMode?: CalendarMode;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * مُدخل تاريخ يدعم التقويمين:
 * - **هجري** (أم القرى): سنة/شهر/يوم من قوائم منسدلة.
 * - **ميلادي**: حقل تاريخ عادي بتقويم المتصفح.
 *
 * أياً كان التقويم المختار، القيمة المحفوظة دائماً ميلادية بصيغة
 * `YYYY-MM-DD` (لأن PostgreSQL يتعامل بالميلادي) ويُرجَع معها المقابل
 * الهجري. كل الحسابات بتوقيت UTC حتى لا يحدث انزياح يوم.
 *
 * يُستخدم داخل النماذج عبر Controller من react-hook-form.
 */
export function HijriDatePicker({
  value,
  onChange,
  id,
  disabled,
  className,
  defaultMode = "hijri",
}: HijriDatePickerProps) {
  const [mode, setMode] = useState<CalendarMode>(defaultMode);
  // نحتفظ بالسنة/الشهر أثناء الاختيار الجزئي حتى لا تُفقد قبل اكتمال التاريخ
  const [draft, setDraft] = useState<{ hy: number; hm: number; hd: number }>({
    hy: 0,
    hm: 0,
    hd: 0,
  });

  const parts = useMemo(() => {
    if (value) {
      try {
        return gregorianToHijri(value);
      } catch {
        /* تجاهل */
      }
    }
    return null;
  }, [value]);

  // لما تتغيّر القيمة من الخارج (تحميل بيانات للتعديل مثلاً) نزامن المسودة
  useEffect(() => {
    if (parts) setDraft(parts);
  }, [parts]);

  const { hy, hm, hd } = parts ?? draft;

  const years = useMemo(() => {
    const current = todayHijri().hy;
    const list: number[] = [];
    // نطاق معقول: من 40 سنة قبل إلى 10 سنوات بعد السنة الحالية
    for (let y = current + 10; y >= current - 40; y--) list.push(y);
    return list;
  }, []);

  function emitHijri(nextY: number, nextM: number, nextD: number) {
    setDraft({ hy: nextY, hm: nextM, hd: nextD });
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

  /** التاريخ الميلادي بصيغة YYYY-MM-DD لحقل input[type=date]. */
  const gregorianInputValue = value ? formatGregorianShort(value) : "";

  function emitGregorian(raw: string) {
    if (!raw) {
      onChange({ gregorian: null, hijri: null });
      return;
    }
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) {
      onChange({ gregorian: null, hijri: null });
      return;
    }
    // منتصف نهار UTC — نفس تطبيع الوضع الهجري، فلا يحدث انزياح يوم
    const d = new Date(
      Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12),
    );
    const h = gregorianToHijri(d);
    setDraft(h);
    onChange({
      gregorian: gregorianISO(d),
      hijri: `${h.hy}-${pad(h.hm)}-${pad(h.hd)}`,
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* مبدّل التقويم — الاختيار للعرض والإدخال فقط، والحفظ دائماً ميلادي */}
      <div
        className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5"
        role="group"
        aria-label="نوع التقويم"
      >
        {(
          [
            { key: "hijri", label: "هجري" },
            { key: "gregorian", label: "ميلادي" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            disabled={disabled}
            aria-pressed={mode === opt.key}
            onClick={() => setMode(opt.key)}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              mode === opt.key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === "hijri" ? (
        <div className="grid grid-cols-3 gap-2" id={id}>
          <div>
            <Select
              aria-label="السنة الهجرية"
              value={hy || ""}
              disabled={disabled}
              onChange={(e) => emitHijri(Number(e.target.value), hm, hd)}
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
              onChange={(e) => emitHijri(hy, Number(e.target.value), hd)}
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
              onChange={(e) => emitHijri(hy, hm, Number(e.target.value))}
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
      ) : (
        <Input
          id={id}
          type="date"
          aria-label="التاريخ الميلادي"
          disabled={disabled}
          value={gregorianInputValue}
          onChange={(e) => emitGregorian(e.target.value)}
        />
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <CalendarDays className="size-3.5 shrink-0" />
        {value ? (
          <span className="tabular-nums">
            {mode === "hijri"
              ? `الموافق ميلادي: ${formatGregorianShort(value)}`
              : `الموافق هجري: ${formatHijri(value)} هـ`}
          </span>
        ) : (
          <span>
            {mode === "hijri"
              ? "اختر السنة والشهر واليوم الهجري لحساب التاريخ الميلادي"
              : "اختر التاريخ الميلادي لحساب التاريخ الهجري"}
          </span>
        )}
      </div>
      {/* حقل مخفي بالميلادي لدعم الإرسال المباشر عند اللزوم */}
      <Input type="hidden" value={value ?? ""} readOnly />
    </div>
  );
}
