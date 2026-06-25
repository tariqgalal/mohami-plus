import { test, expect } from "@playwright/test";
import { ACCOUNTS, apiLogin } from "./_helpers";

test.describe("Auth — تسجيل الدخول والخروج", () => {
  test("تسجيل دخول صحيح يوصّل للداشبورد", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "البريد الإلكتروني" }).fill(ACCOUNTS.firmA.email);
    await page.getByRole("textbox", { name: "كلمة المرور" }).fill(ACCOUNTS.firmA.password);
    await page.getByRole("button", { name: /تسجيل الدخول/ }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("بيانات غلط تعرض رسالة خطأ بالعربي", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "البريد الإلكتروني" }).fill("not-real@nowhere.test");
    await page.getByRole("textbox", { name: "كلمة المرور" }).fill("WrongPass99");
    await page.getByRole("button", { name: /تسجيل الدخول/ }).click();
    await expect(
      page.getByText(/البريد الإلكتروني أو كلمة المرور غير صحيحة/),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("الصفحات المحمية تعمل redirect لصفحة الدخول", async ({ page }) => {
    await page.goto("/dashboard/cases");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/login/);
  });

  test("مدير مكتب عادي لا يقدر يدخل لوحة Super Admin", async ({
    request,
    page,
  }) => {
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const res = await request.get("/api/admin/tenants?limit=1", {
      failOnStatusCode: false,
    });
    expect([401, 403]).toContain(res.status());

    await page.goto("/admin");
    // middleware should redirect or block
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toMatch(/^\/admin$|^\/admin\/?$/);
  });

  test("Super Admin يقدر يدخل لوحة المنصة", async ({ request }) => {
    await apiLogin(
      request,
      ACCOUNTS.superAdmin.email,
      ACCOUNTS.superAdmin.password,
    );
    const res = await request.get("/api/admin/tenants?limit=1");
    expect(res.ok()).toBeTruthy();
  });
});
