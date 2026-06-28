/**
 * Lightweight email sender — calls Resend HTTPS API directly so we don't need
 * to install the official `resend` SDK (one less dep). Falls back to logging
 * when RESEND_API_KEY is not configured (dev mode + safe deploy).
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM =
  process.env.EMAIL_FROM || "onboarding@resend.dev";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export interface SendEmailResult {
  delivered: boolean;
  provider: "resend" | "dev-log";
  providerId?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    // Dev-mode: log instead of failing — owner can wire Resend later.
    console.log("[email:dev-log]", {
      to: input.to,
      subject: input.subject,
      bodyPreview: input.text?.slice(0, 120) ?? input.html.slice(0, 120),
    });
    return { delivered: false, provider: "dev-log" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from || DEFAULT_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!res.ok) {
    return {
      delivered: false,
      provider: "resend",
      error: data?.message || `HTTP ${res.status}`,
    };
  }
  return { delivered: true, provider: "resend", providerId: data?.id };
}
