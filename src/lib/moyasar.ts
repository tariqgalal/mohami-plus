/**
 * طبقة Moyasar الخدمية (Server-side only).
 *
 * المرجع: https://docs.moyasar.com/api/payments + https://docs.moyasar.com/api/other/webhooks
 *
 * قواعد:
 * 1) كل المبالغ المُرسلة هنا بالهللات (Int) — مش بالريال.
 * 2) لا تُستدعى أي دالة من هذا الملف من client component مباشرة.
 * 3) المفاتيح حالياً Test Mode فقط (sk_test_ / pk_test_).
 */

import { timingSafeEqual } from "node:crypto";

const MOYASAR_API_BASE = "https://api.moyasar.com/v1";

function getSecretKey(): string {
  const key = process.env.MOYASAR_SECRET_KEY_TEST;
  if (!key) {
    throw new MoyasarConfigError(
      "MOYASAR_SECRET_KEY_TEST غير مضبوط. أضفه إلى متغيرات البيئة.",
    );
  }
  return key;
}

export function getPublishableKey(): string {
  const key = process.env.MOYASAR_PUBLISHABLE_KEY_TEST;
  if (!key) {
    throw new MoyasarConfigError(
      "MOYASAR_PUBLISHABLE_KEY_TEST غير مضبوط. أضفه إلى متغيرات البيئة.",
    );
  }
  return key;
}

export class MoyasarError extends Error {
  status: number;
  type?: string;
  details?: unknown;
  constructor(message: string, status = 500, type?: string, details?: unknown) {
    super(message);
    this.name = "MoyasarError";
    this.status = status;
    this.type = type;
    this.details = details;
  }
}

export class MoyasarConfigError extends MoyasarError {
  constructor(message: string) {
    super(message, 500, "config_error");
    this.name = "MoyasarConfigError";
  }
}

// ============ Types ============

export type MoyasarPaymentStatus =
  | "initiated"
  | "paid"
  | "failed"
  | "authorized"
  | "captured"
  | "refunded"
  | "voided"
  | "verified";

export interface MoyasarSource {
  type: "creditcard" | "applepay" | "stcpay" | "samsungpay" | string;
  // Card source fields (populated after charge)
  company?: string; // visa / mada / mastercard ...
  number?: string;  // masked, e.g. "XXXX-XXXX-XXXX-1234"
  token?: string;   // tokenization id when saved
  message?: string;
}

export interface MoyasarPayment {
  id: string;
  status: MoyasarPaymentStatus;
  amount: number;         // halalat
  amount_format?: string;
  currency: string;       // "SAR"
  refunded: number;
  refunded_at?: string | null;
  captured?: number;
  captured_at?: string | null;
  voided_at?: string | null;
  description?: string | null;
  fee?: number;
  invoice_id?: string | null;
  ip?: string | null;
  callback_url?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, string> | null;
  source: MoyasarSource;
}

// ============ Low-level HTTP ============

async function moyasarFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const secretKey = getSecretKey();
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch(`${MOYASAR_API_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ??
      `Moyasar ${init.method ?? "GET"} ${path} فشل (${res.status})`;
    throw new MoyasarError(message, res.status, "api_error", body);
  }
  return body as T;
}

// ============ Public API ============

/**
 * يجلب حالة الدفع الحقيقية من Moyasar بمفتاح السرّ.
 * استخدمها دايماً للتأكيد النهائي للدفع — لا تعتمد على رد الواجهة.
 */
export async function verifyPayment(paymentId: string): Promise<MoyasarPayment> {
  if (!paymentId) {
    throw new MoyasarError("معرّف الدفع مطلوب", 400, "validation_error");
  }
  return moyasarFetch<MoyasarPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

/**
 * يشحن كارت محفوظ (token) بمبلغ بالهللات.
 * مخصص للتجديد التلقائي AUTO_RENEW.
 */
export async function chargeToken(params: {
  tokenId: string;
  amountHalalat: number;
  description: string;
  callbackUrl?: string;
  metadata?: Record<string, string>;
}): Promise<MoyasarPayment> {
  if (!Number.isInteger(params.amountHalalat) || params.amountHalalat <= 0) {
    throw new MoyasarError(
      "amountHalalat يجب أن يكون عدداً صحيحاً موجباً (بالهللات)",
      400,
      "validation_error",
    );
  }
  return moyasarFetch<MoyasarPayment>("/payments", {
    method: "POST",
    body: {
      amount: params.amountHalalat,
      currency: "SAR",
      description: params.description,
      callback_url: params.callbackUrl,
      source: {
        type: "token",
        token: params.tokenId,
      },
      metadata: params.metadata,
    },
  });
}

/**
 * التحقق من webhook قادم من Moyasar.
 *
 * الطريقة الرسمية (راجع docs.moyasar.com → Webhooks):
 * - Moyasar تبعت الـ shared_secret كحقل JSON اسمه `secret_token`
 *   في جسم الـ webhook (مش في header).
 * - المستقبِل يقارنه بالقيمة المخزّنة عنده (MOYASAR_WEBHOOK_SECRET)
 *   بمقارنة timing-safe لمنع timing attacks.
 *
 * يرمي MoyasarError(401) لو التحقق فشل.
 */
export function verifyWebhookPayload(payload: unknown): asserts payload is {
  id: string;
  type: string;
  secret_token: string;
  data: { object: string; [key: string]: unknown };
  created_at?: string;
  live?: boolean;
  account_name?: string;
} {
  const expected = process.env.MOYASAR_WEBHOOK_SECRET;
  if (!expected) {
    throw new MoyasarConfigError(
      "MOYASAR_WEBHOOK_SECRET غير مضبوط. لا يمكن التحقق من الـ webhooks.",
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new MoyasarError("جسم الـ webhook غير صالح", 400, "invalid_payload");
  }
  const obj = payload as Record<string, unknown>;

  const got = typeof obj.secret_token === "string" ? obj.secret_token : "";
  if (!got) {
    throw new MoyasarError(
      "secret_token مفقود من جسم الـ webhook",
      401,
      "unauthorized_webhook",
    );
  }

  // مقارنة timing-safe — لازم نفس الطول
  const gotBuf = Buffer.from(got);
  const expectedBuf = Buffer.from(expected);
  if (
    gotBuf.length !== expectedBuf.length ||
    !timingSafeEqual(gotBuf, expectedBuf)
  ) {
    throw new MoyasarError(
      "secret_token غير مطابق — Webhook غير موثوق",
      401,
      "unauthorized_webhook",
    );
  }

  if (typeof obj.id !== "string" || typeof obj.type !== "string" || !obj.data) {
    throw new MoyasarError(
      "بنية الـ webhook غير متوقعة",
      400,
      "invalid_payload",
    );
  }
}

/**
 * هل ميزة الـ Tokenization مفعّلة في الحساب؟
 * تُتحكم بـ env var MOYASAR_TOKENIZATION_ENABLED.
 * لو معطّلة → خيار AUTO_RENEW يظهر "قريباً" في الواجهة، والـ cron للخصم التلقائي
 * يتجاوز الاشتراكات.
 */
export function isTokenizationEnabled(): boolean {
  return process.env.MOYASAR_TOKENIZATION_ENABLED === "true";
}
