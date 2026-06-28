import { z } from "zod";

// Saudi mobile: accepts 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX, 009665XXXXXXXX
// with or without spaces / hyphens / parentheses. Normalizes to +9665XXXXXXXX.
const SAUDI_MOBILE_REGEX = /^(?:(?:\+|00)?966|0)?5[0-9]{8}$/;

function stripSeparators(val: string): string {
  return val.replace(/[\s\-()]/g, "");
}

export function normalizeSaudiMobile(raw: string): string | null {
  const cleaned = stripSeparators(String(raw ?? "").trim());
  if (!SAUDI_MOBILE_REGEX.test(cleaned)) return null;
  const digits = cleaned.replace(/^(\+|00)?966/, "").replace(/^0/, "");
  return `+966${digits}`;
}

export const saudiMobileSchema = z
  .string({ error: "رقم الجوال مطلوب" })
  .trim()
  .transform((val) => stripSeparators(val))
  .refine((val) => SAUDI_MOBILE_REGEX.test(val), {
    message: "رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 أو +9665 ويتكون من 9 أرقام",
  })
  .transform((val) => {
    const digits = val.replace(/^(\+|00)?966/, "").replace(/^0/, "");
    return `+966${digits}`;
  });

export const emailSchema = z
  .string({ error: "البريد الإلكتروني مطلوب" })
  .trim()
  .toLowerCase()
  .email({ message: "صيغة البريد الإلكتروني غير صحيحة" })
  .refine(
    (val) => {
      // reject non-ASCII domains (Arabic letters in domain) — Latin allowed only
      const at = val.lastIndexOf("@");
      if (at < 0) return false;
      const domain = val.slice(at + 1);
      return /^[\x21-\x7e]+$/.test(domain);
    },
    { message: "صيغة البريد الإلكتروني غير صحيحة" },
  );

// Optional variants — accept empty string / null / undefined, output `string | null | undefined`
// (keeps compatibility with existing form fields that allow undefined defaults).
export const optionalSaudiMobileSchema = z
  .union([z.literal(""), z.null(), z.undefined(), saudiMobileSchema])
  .transform((v): string | null | undefined => {
    if (v === "" || v === null) return null;
    if (v === undefined) return undefined;
    return v;
  });

export const optionalEmailSchema = z
  .union([z.literal(""), z.null(), z.undefined(), emailSchema])
  .transform((v): string | null | undefined => {
    if (v === "" || v === null) return null;
    if (v === undefined) return undefined;
    return v;
  });

export function isValidSaudiMobile(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return normalizeSaudiMobile(raw) !== null;
}

export function isValidEmail(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const parsed = emailSchema.safeParse(raw);
  return parsed.success;
}
