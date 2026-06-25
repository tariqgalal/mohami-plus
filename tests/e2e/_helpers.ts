import { APIRequestContext, expect, Page } from "@playwright/test";

export const ACCOUNTS = {
  superAdmin: { email: "admin@mohamiplus.sa", password: "Admin@12345" },
  firmA: { email: "admin@demo-firm.sa", password: "Admin@12345" },
  firmB: { email: "admin@aladala.sa", password: "Admin@12345" },
  firmC: { email: "admin@almizan.sa", password: "Admin@12345" },
} as const;

export async function uiLogin(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "البريد الإلكتروني" }).fill(email);
  await page.getByRole("textbox", { name: "كلمة المرور" }).fill(password);
  await page.getByRole("button", { name: /تسجيل الدخول/ }).click();
}

export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const csrfRes = await request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const res = await request.post("/api/auth/callback/credentials", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    form: {
      csrfToken,
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: "false",
      json: "true",
    },
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  expect([200, 302]).toContain(res.status());
  const session = await request.get("/api/auth/session");
  return session.json();
}

export async function apiLogout(request: APIRequestContext) {
  const csrfRes = await request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  await request.post("/api/auth/signout", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    form: { csrfToken, callbackUrl: "/login", json: "true" },
    failOnStatusCode: false,
  });
}

export async function getOneCaseId(
  request: APIRequestContext,
): Promise<string | null> {
  const res = await request.get("/api/cases?limit=1");
  if (!res.ok()) return null;
  const json = await res.json();
  const items = json?.data?.items ?? json?.data?.data ?? json?.data ?? [];
  const first = Array.isArray(items) ? items[0] : items.items?.[0];
  return first?.id ?? null;
}

export async function getOneClientId(
  request: APIRequestContext,
): Promise<string | null> {
  const res = await request.get("/api/clients?limit=1");
  if (!res.ok()) return null;
  const json = await res.json();
  const items = json?.data?.items ?? json?.data?.data ?? json?.data ?? [];
  const first = Array.isArray(items) ? items[0] : items.items?.[0];
  return first?.id ?? null;
}
