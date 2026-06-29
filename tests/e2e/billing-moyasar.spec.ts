import { test, expect } from "@playwright/test";
import { ACCOUNTS, apiLogin, apiLogout, uiLogin } from "./_helpers";

/**
 * E2E لتكامل Moyasar.
 *
 * هذه الاختبارات تختبر:
 *  1) منطق الحساب والـ schema (لا تتطلب Moyasar حياً)
 *  2) واجهة /dashboard/billing وUI الاختيار
 *  3) قبول/رفض الـ webhook بناءً على secret_token (mock)
 *  4) idempotency للـ webhook
 *  5) عزل المكاتب: مكتب لا يرى فواتير اشتراك مكتب آخر
 *
 * الأجزاء اللي بتتطلب تفاعل حقيقي مع Moyasar (نموذج الدفع inline + 3DS)
 * تتم اختبارها يدوياً في Test Mode حسب جدول MOYASAR_INTEGRATION.md.
 */

test.describe("Moyasar billing — UI", () => {
  test("صفحة /dashboard/billing تفتح وتعرض الباقات", async ({ page }) => {
    await uiLogin(page, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    await page.waitForURL(/\/dashboard/);
    await page.goto("/dashboard/billing");

    await expect(
      page.getByRole("heading", { name: "الاشتراك والفوترة" }),
    ).toBeVisible();
    await expect(page.getByText("متابعة الدفع")).toBeVisible();

    // الباقات الثلاث ظاهرة
    await expect(page.getByText("أساسي", { exact: true })).toBeVisible();
    await expect(page.getByText("احترافي", { exact: true })).toBeVisible();
    await expect(page.getByText("مؤسسي", { exact: true })).toBeVisible();

    // ضريبة 15% مذكورة
    await expect(page.getByText(/ضريبة 15%/).first()).toBeVisible();
  });

  test("التجديد التلقائي معطّل لما Tokenization مش مفعّل", async ({ page }) => {
    await uiLogin(page, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    await page.goto("/dashboard/billing");

    // لو MOYASAR_TOKENIZATION_ENABLED مش "true"، شارة "قريباً" بتظهر
    if (process.env.MOYASAR_TOKENIZATION_ENABLED !== "true") {
      await expect(page.getByText("قريباً")).toBeVisible();
    }
  });
});

test.describe("Moyasar billing — API", () => {
  test("GET /api/billing/subscription يرجع بيانات الاشتراك للمكتب", async ({ request }) => {
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const res = await request.get("/api/billing/subscription");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.subscription).toBeTruthy();
    expect(json.data.subscription.plan).toMatch(
      /BASIC|PROFESSIONAL|ENTERPRISE/,
    );
    expect(typeof json.data.tokenizationEnabled).toBe("boolean");
    await apiLogout(request);
  });

  test("POST /api/billing/checkout يحسب الضريبة 15% صح ويولد رقم فاتورة MP-YYYY-NNNNNN", async ({
    request,
  }) => {
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const res = await request.post("/api/billing/checkout", {
      data: { plan: "BASIC", billingType: "MANUAL" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // 199 ر.س = 19900 هللة، VAT 15% = 2985، إجمالي 22885
    expect(json.data.baseAmount).toBe(19900);
    expect(json.data.vatAmount).toBe(2985);
    expect(json.data.amountHalalat).toBe(22885);
    expect(json.data.invoiceNumber).toMatch(/^MP-\d{4}-\d{6}$/);
    expect(json.data.callbackUrl).toContain("/dashboard/billing/callback");
    await apiLogout(request);
  });

  test("POST /api/billing/checkout يرفض AUTO_RENEW لو Tokenization معطّل", async ({
    request,
  }) => {
    if (process.env.MOYASAR_TOKENIZATION_ENABLED === "true") {
      test.skip();
      return;
    }
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const res = await request.post("/api/billing/checkout", {
      data: { plan: "BASIC", billingType: "AUTO_RENEW" },
    });
    expect(res.status()).toBe(400);
    await apiLogout(request);
  });
});

test.describe("Moyasar billing — Webhook", () => {
  test("webhook يرفض الطلب لو secret_token مفقود/خطأ", async ({ request }) => {
    const res = await request.post("/api/webhooks/moyasar", {
      data: {
        id: "evt_bad_1",
        type: "payment_paid",
        secret_token: "wrong-secret-xxx",
        data: { object: "payment", id: "pay_x", status: "paid", amount: 22885, source: { type: "creditcard" } },
      },
    });
    expect(res.status()).toBe(401);
  });

  test("webhook idempotent — نفس الـ event id لا يُعالج مرتين", async ({ request }) => {
    const secret = process.env.MOYASAR_WEBHOOK_SECRET;
    if (!secret) {
      test.skip();
      return;
    }
    // الـ payment ID وهمي لكن invoice ID مش موجود → handler يطبع تحذير ويسجل event
    const eventId = `evt_test_${Date.now()}`;
    const payload = {
      id: eventId,
      type: "payment_paid",
      secret_token: secret,
      data: {
        object: "payment",
        id: "pay_idem_test",
        status: "paid",
        amount: 22885,
        source: { type: "creditcard" },
        metadata: { invoiceId: "non-existent-invoice" },
      },
    };

    const first = await request.post("/api/webhooks/moyasar", { data: payload });
    expect(first.ok()).toBeTruthy();

    const second = await request.post("/api/webhooks/moyasar", { data: payload });
    expect(second.ok()).toBeTruthy();
    const secondBody = await second.json();
    expect(secondBody.duplicate).toBe(true);
  });
});

test.describe("Moyasar billing — Tenant isolation", () => {
  test("مكتب لا يرى فواتير اشتراك مكتب آخر", async ({ request }) => {
    // أنشئ فاتورة في المكتب A
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const checkoutA = await request.post("/api/billing/checkout", {
      data: { plan: "BASIC", billingType: "MANUAL" },
    });
    const checkoutAJson = await checkoutA.json();
    const invoiceANumber = checkoutAJson.data.invoiceNumber as string;
    await apiLogout(request);

    // سجّل بالمكتب B واطلب الفواتير
    await apiLogin(request, ACCOUNTS.firmB.email, ACCOUNTS.firmB.password);
    const subB = await request.get("/api/billing/subscription");
    const subBJson = await subB.json();
    const numbersB = (
      subBJson.data.invoices as { invoiceNumber: string }[]
    ).map((i) => i.invoiceNumber);
    expect(numbersB).not.toContain(invoiceANumber);
    await apiLogout(request);
  });
});
