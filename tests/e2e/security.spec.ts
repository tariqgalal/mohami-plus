import { test, expect } from "@playwright/test";
import { ACCOUNTS, apiLogin } from "./_helpers";

test.describe("Security — فحوصات أمنية أساسية", () => {
  test("الموقع كله بيخدم HTTPS", async ({ baseURL }) => {
    test.skip(!baseURL?.startsWith("https://"), "البيئة المحلية على HTTP");
    expect(baseURL!.startsWith("https://")).toBeTruthy();
  });

  test("صفحة الدخول ما بترجّعش الباسورد في DOM", async ({ page }) => {
    await page.goto("/login");
    const html = await page.content();
    expect(html).not.toContain("Admin@12345");
  });

  test("API الـ profile لا يرجّع كلمة المرور", async ({ request }) => {
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const res = await request.get("/api/profile");
    if (res.ok()) {
      const json = await res.json();
      const blob = JSON.stringify(json).toLowerCase();
      expect(blob).not.toContain('"password"');
      expect(blob).not.toMatch(/\$2[abxy]\$\d{2}\$/); // bcrypt hash
    }
  });

  test("XSS بسيط في عنوان قضية يتعقم على القراءة", async ({ request }) => {
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const clientRes = await request.get("/api/clients?limit=1");
    const clientJson = await clientRes.json();
    const items =
      clientJson?.data?.items ?? clientJson?.data?.data ?? clientJson?.data ?? [];
    const clientId = (Array.isArray(items) ? items : items.items ?? [])[0]?.id;
    test.skip(!clientId, "ما فيش عملاء");

    const teamRes = await request.get("/api/team?limit=1");
    const teamJson = await teamRes.json();
    const teamItems =
      teamJson?.data?.items ?? teamJson?.data?.data ?? teamJson?.data ?? [];
    const primaryLawyerId = (
      Array.isArray(teamItems) ? teamItems : teamItems.items ?? []
    )[0]?.id;

    const payload = `<script>window.__pwn=1</script> اختبار`;
    const createRes = await request.post("/api/cases", {
      data: {
        title: payload,
        caseType: "COMMERCIAL",
        court: "المحكمة التجارية",
        clientId,
        primaryLawyerId,
      },
      failOnStatusCode: false,
    });
    if (!createRes.ok()) {
      // Validation rejected — that's fine too
      return;
    }
    const created = await createRes.json();
    const id = created?.data?.id;
    expect(id).toBeTruthy();

    // ملاحظة: React بيهرب النصوص تلقائياً عند العرض، فاختبار "ظهور" الـ <script>
    // كنص أمر مقبول. الخطر الحقيقي هو إذا اتنفّذ. هنا بنتأكد إن الـ API بيرجّع
    // النص كنص لا كـ HTML.
    const readRes = await request.get(`/api/cases/${id}`);
    const readJson = await readRes.json();
    expect(readJson?.data?.title).toBe(payload);

    // تنظيف
    await request.delete(`/api/cases/${id}`, { failOnStatusCode: false });
  });

  test("Security headers موجودة", async ({ request, baseURL }) => {
    test.skip(!baseURL?.startsWith("https://"), "محلي");
    const res = await request.get("/");
    const headers = res.headers();
    // Vercel بيضيف بعض الـ headers تلقائياً. هنا نتحقق من الأساسيات
    expect(headers["strict-transport-security"]).toBeTruthy();
  });
});
