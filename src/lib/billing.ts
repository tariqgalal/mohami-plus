/**
 * طبقة الفوترة والضريبة لاشتراكات المنصة.
 *
 * قواعد أساسية:
 * - كل المبالغ تُمثَّل بالهللات (Int). 1 ريال = 100 هللة.
 * - VAT 15% (هيئة الزكاة والضريبة والجمارك — ZATCA).
 * - الأسعار في PLANS مُخزّنة بالريال (قبل الضريبة).
 * - رقم الفاتورة: MP-YYYY-NNNNNN — تسلسلي وفريد (مطلوب لـ ZATCA).
 */

import { PLANS, type PlanKey } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

// 15.00% بصيغة basis points (× 100) — مخزّن مع كل فاتورة لو تغيّرت لاحقاً
export const VAT_RATE_BPS = 1500;

export const HALALAT_PER_SAR = 100;

// ============ تحويلات SAR ↔ Halalat ============

export function sarToHalalat(sar: number): number {
  if (!Number.isFinite(sar) || sar < 0) {
    throw new Error("قيمة الريال غير صالحة");
  }
  return Math.round(sar * HALALAT_PER_SAR);
}

export function halalatToSar(halalat: number): number {
  if (!Number.isInteger(halalat) || halalat < 0) {
    throw new Error("قيمة الهللات يجب أن تكون عدداً صحيحاً موجباً");
  }
  return halalat / HALALAT_PER_SAR;
}

/** تنسيق مبلغ بالهللات إلى نص ريال (مثلاً "228.85 ر.س"). */
export function formatHalalat(halalat: number): string {
  return `${halalatToSar(halalat).toFixed(2)} ر.س`;
}

// ============ حساب الضريبة ============

export interface PriceBreakdown {
  baseAmount: number;  // قبل الضريبة (هللات)
  vatAmount: number;   // قيمة الضريبة (هللات)
  totalAmount: number; // الإجمالي شامل الضريبة (هللات)
  vatRateBps: number;  // النسبة المستخدمة (basis points)
}

/**
 * يحسب الضريبة وإجمالي السعر من سعر الباقة الأساسي.
 * مثال: BASIC (199 ر.س) → base=19900, vat=2985, total=22885
 */
export function computePlanPrice(plan: PlanKey): PriceBreakdown {
  const planDef = PLANS[plan];
  if (!planDef) {
    throw new Error(`باقة غير معروفة: ${plan}`);
  }
  const baseAmount = sarToHalalat(planDef.price);
  const vatAmount = Math.round((baseAmount * VAT_RATE_BPS) / 10000);
  return {
    baseAmount,
    vatAmount,
    totalAmount: baseAmount + vatAmount,
    vatRateBps: VAT_RATE_BPS,
  };
}

/** نسخة عامة لأي مبلغ أساسي (للاستخدام في تمديدات يدوية مستقبلاً). */
export function computePriceFromBase(baseHalalat: number): PriceBreakdown {
  if (!Number.isInteger(baseHalalat) || baseHalalat < 0) {
    throw new Error("baseHalalat يجب أن يكون عدداً صحيحاً موجباً (هللات)");
  }
  const vatAmount = Math.round((baseHalalat * VAT_RATE_BPS) / 10000);
  return {
    baseAmount: baseHalalat,
    vatAmount,
    totalAmount: baseHalalat + vatAmount,
    vatRateBps: VAT_RATE_BPS,
  };
}

// ============ رقم الفاتورة (MP-YYYY-NNNNNN) ============

/**
 * يولد رقم فاتورة فريد ومتسلسل لسنة معيّنة.
 * يستخدم جدول PlatformInvoiceCounter مع upsert atomic داخل المعاملة.
 *
 * **مهم**: يجب استدعاء هذه الدالة داخل prisma.$transaction لضمان عدم
 * تخصيص نفس الرقم لفاتورتين متزامنتين.
 */
export async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  now: Date = new Date(),
): Promise<string> {
  const year = now.getUTCFullYear();
  const counter = await tx.platformInvoiceCounter.upsert({
    where: { year },
    create: { year, current: 1 },
    update: { current: { increment: 1 } },
  });
  const padded = String(counter.current).padStart(6, "0");
  return `MP-${year}-${padded}`;
}

// ============ مدد الفترات ============

/** يضيف N شهر إلى تاريخ (يحافظ على آخر يوم الشهر إذا اقتضى). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// ============ توكن رابط الدفع العام ============

/** يولد توكن آمن (32 char hex) لرابط دفع الفاتورة اليدوية. */
export function generatePublicToken(): string {
  // استخدم crypto.randomUUID() المتوفر في Node 19+
  return crypto.randomUUID().replace(/-/g, "");
}

// ============ سياسة التجديد التلقائي ============

/**
 * جدول إعادة محاولات الخصم التلقائي بعد فشل الدفعة.
 * المحاولات: يوم 0 (الفشل الأصلي) → يوم 3 → يوم 7.
 * بعد المحاولة الثالثة تُعتبر فترة السماح انتهت.
 */
export const AUTO_RENEW_RETRY_SCHEDULE = {
  maxAttempts: 3,
  retryDelaysDays: [3, 4] as const, // 0 → +3 = 3, ثم +4 = 7
  graceTotalDays: 7,
} as const;

/**
 * يحسب موعد المحاولة القادمة بناءً على عدد المحاولات الفاشلة السابقة.
 * - 0 محاولات سابقة → null (الدفعة الأصلية لسه ما اتجربت)
 * - 1 محاولة فاشلة → بعد 3 أيام
 * - 2 محاولة فاشلة → بعد 4 أيام (إجمالي 7)
 * - 3+ → null (نخلص فترة السماح)
 */
export function nextAutoRenewAttemptAt(
  failedAttempts: number,
  lastAttemptAt: Date,
): Date | null {
  if (failedAttempts < 1) return null;
  if (failedAttempts >= AUTO_RENEW_RETRY_SCHEDULE.maxAttempts) return null;
  const delay = AUTO_RENEW_RETRY_SCHEDULE.retryDelaysDays[failedAttempts - 1];
  if (delay === undefined) return null;
  return addDays(lastAttemptAt, delay);
}
