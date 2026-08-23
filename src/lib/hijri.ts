// ====================================================================
// تحويل التواريخ الهجرية (أم القرى) ↔ الميلادية
// ====================================================================
// نعتمد على Intl مع تقويم "islamic-umalqura" وهو نفس تقويم أم القرى
// المعتمد رسمياً في السعودية. الاعتماد على Intl فقط (بدون مكتبات خارجية)
// يضمن أن العرض والإدخال يستخدمان نفس التقويم تماماً فلا يحدث اختلاف يوم
// بين ما يُعرض وما يُحفظ.
//
// كل الحسابات تتم بتوقيت UTC (منتصف النهار) لتجنّب انزياح يوم بسبب
// اختلاف المناطق الزمنية للمستخدمين.

export interface HijriParts {
  hy: number; // السنة الهجرية
  hm: number; // الشهر (1-12)
  hd: number; // اليوم (1-30)
}

export const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
] as const;

const DAY_MS = 86_400_000;

// مُنسّق أم القرى — أرقام لاتينية بتوقيت UTC
const umFormatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** يبني تاريخ Date عند منتصف نهار UTC ليوم ميلادي محدد (يتفادى انزياح المناطق). */
function utcNoon(year: number, month0: number, day: number): Date {
  return new Date(Date.UTC(year, month0, day, 12));
}

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** يحوّل تاريخاً ميلادياً إلى أجزاء هجرية (أم القرى). */
export function gregorianToHijri(value: Date | string): HijriParts {
  const d = toDate(value);
  const parts = umFormatter.formatToParts(d);
  let hy = 0;
  let hm = 0;
  let hd = 0;
  for (const p of parts) {
    if (p.type === "year") hy = parseInt(p.value, 10);
    else if (p.type === "month") hm = parseInt(p.value, 10);
    else if (p.type === "day") hd = parseInt(p.value, 10);
  }
  return { hy, hm, hd };
}

function compareParts(a: HijriParts, b: HijriParts): number {
  if (a.hy !== b.hy) return a.hy < b.hy ? -1 : 1;
  if (a.hm !== b.hm) return a.hm < b.hm ? -1 : 1;
  if (a.hd !== b.hd) return a.hd < b.hd ? -1 : 1;
  return 0;
}

/**
 * يحوّل أجزاء هجرية إلى تاريخ ميلادي (منتصف نهار UTC).
 * الطريقة: تقدير أولي خطّي ثم ضبط دقيق بمقارنة نتيجة Intl خطوة بخطوة،
 * فتكون النتيجة متطابقة مع تقويم أم القرى المستخدم في العرض. إذا كان
 * اليوم المُدخل غير موجود في الشهر (مثل 30 في شهر 29 يوماً) تُرجع أقرب
 * تاريخ صحيح.
 */
export function hijriToGregorian(hy: number, hm: number, hd: number): Date {
  // مبدأ التقويم الهجري: 1 محرم سنة 1 هـ ≈ 19 يوليو 622م (تقويم ميلادي ممتد)
  const epochMs = Date.UTC(622, 6, 19, 12);
  const approxDays = Math.floor(
    (hy - 1) * 354.36707 + (hm - 1) * 29.530589 + (hd - 1),
  );
  let g = new Date(epochMs + approxDays * DAY_MS);

  const target: HijriParts = { hy, hm, hd };
  let prevDir = 0;
  for (let i = 0; i < 400; i++) {
    const cmp = compareParts(gregorianToHijri(g), target);
    if (cmp === 0) break;
    const dir = cmp < 0 ? 1 : -1; // النتيجة أصغر من الهدف → تقدّم للأمام
    // إذا انعكس الاتجاه فقد تجاوزنا الهدف (تاريخ غير موجود) → أقرب تاريخ
    if (prevDir !== 0 && dir !== prevDir) break;
    g = new Date(g.getTime() + dir * DAY_MS);
    prevDir = dir;
  }
  // تطبيع إلى منتصف نهار UTC لنفس اليوم
  return utcNoon(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate());
}

export function isValidHijriParts(hy: number, hm: number, hd: number): boolean {
  if (!Number.isInteger(hy) || hy < 1300 || hy > 1600) return false;
  if (!Number.isInteger(hm) || hm < 1 || hm > 12) return false;
  if (!Number.isInteger(hd) || hd < 1 || hd > 30) return false;
  // تأكد أن اليوم موجود فعلاً (الشهر قد يكون 29 يوماً)
  const g = hijriToGregorian(hy, hm, hd);
  const back = gregorianToHijri(g);
  return back.hy === hy && back.hm === hm && back.hd === hd;
}

/** "1447-05-08" من تاريخ ميلادي. */
export function formatHijri(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const { hy, hm, hd } = gregorianToHijri(toDate(value));
  return `${hy}-${pad(hm)}-${pad(hd)}`;
}

/** "8 جمادى الأولى 1447 هـ" من تاريخ ميلادي. */
export function formatHijriLong(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const { hy, hm, hd } = gregorianToHijri(toDate(value));
  return `${hd} ${HIJRI_MONTHS[hm - 1]} ${hy} هـ`;
}

/** "2026-07-22" (أرقام لاتينية، بتوقيت UTC) من تاريخ ميلادي. */
export function formatGregorianShort(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const d = toDate(value);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** يحلّل نص هجري "1447-05-08" أو "1447/5/8" إلى أجزاء، أو null إن كان غير صالح. */
export function parseHijriString(input: string): HijriParts | null {
  const m = input.trim().match(/^(\d{3,4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!m) return null;
  const hy = parseInt(m[1], 10);
  const hm = parseInt(m[2], 10);
  const hd = parseInt(m[3], 10);
  if (!isValidHijriParts(hy, hm, hd)) return null;
  return { hy, hm, hd };
}

/** أجزاء اليوم الهجري الحالي. */
export function todayHijri(): HijriParts {
  return gregorianToHijri(new Date());
}

/** يبني "YYYY-MM-DD" ميلادي (UTC) صالح لحقل input[type=date] أو للحفظ. */
export function gregorianISO(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}
