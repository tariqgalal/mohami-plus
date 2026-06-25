import { test, expect } from "@playwright/test";
import { ACCOUNTS, apiLogin, getOneClientId } from "./_helpers";

test.describe("Cases — CRUD على القضايا", () => {
  let createdId: string | null = null;
  let lawyerId: string | null = null;

  test.beforeEach(async ({ request }) => {
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
  });

  test("جلب قائمة الفريق للحصول على lawyerId", async ({ request }) => {
    const res = await request.get("/api/team?limit=1");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const items =
      json?.data?.items ?? json?.data?.data ?? json?.data ?? [];
    const arr = Array.isArray(items) ? items : items.items ?? [];
    lawyerId = arr[0]?.id ?? null;
    expect(lawyerId).toBeTruthy();
  });

  test("إنشاء قضية جديدة + قراءتها + تعديلها + حذفها", async ({ request }) => {
    const clientId = await getOneClientId(request);
    test.skip(!clientId, "ما فيش عملاء للاختبار");

    const teamRes = await request.get("/api/team?limit=1");
    const teamJson = await teamRes.json();
    const teamItems =
      teamJson?.data?.items ?? teamJson?.data?.data ?? teamJson?.data ?? [];
    const arr = Array.isArray(teamItems) ? teamItems : teamItems.items ?? [];
    const primaryLawyerId = arr[0]?.id;
    expect(primaryLawyerId).toBeTruthy();

    // إنشاء
    const createRes = await request.post("/api/cases", {
      data: {
        title: "قضية اختبار E2E " + Date.now(),
        caseType: "COMMERCIAL",
        court: "المحكمة التجارية",
        clientId,
        primaryLawyerId,
        priority: "MEDIUM",
        status: "OPEN",
      },
      failOnStatusCode: false,
    });
    expect(
      [200, 201].includes(createRes.status()),
      `create failed: ${await createRes.text()}`,
    ).toBeTruthy();
    const created = await createRes.json();
    createdId = created?.data?.id;
    expect(createdId).toBeTruthy();

    // قراءة
    const getRes = await request.get(`/api/cases/${createdId}`);
    expect(getRes.ok()).toBeTruthy();
    const got = await getRes.json();
    expect(got?.data?.title).toContain("E2E");

    // تعديل
    const putRes = await request.put(`/api/cases/${createdId}`, {
      data: { title: "قضية اختبار E2E - معدّلة" },
      failOnStatusCode: false,
    });
    expect(putRes.ok()).toBeTruthy();
    const updated = await putRes.json();
    expect(updated?.data?.title).toContain("معدّلة");

    // حذف
    const delRes = await request.delete(`/api/cases/${createdId}`, {
      failOnStatusCode: false,
    });
    expect(delRes.ok()).toBeTruthy();

    // التأكد إن الحذف تم
    const after = await request.get(`/api/cases/${createdId}`, {
      failOnStatusCode: false,
    });
    expect([404, 410]).toContain(after.status());
  });

  test("validation: ما تقبلش عنوان قصير", async ({ request }) => {
    const res = await request.post("/api/cases", {
      data: { title: "x", caseType: "COMMERCIAL", court: "x" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    const json = await res.json();
    expect(json?.success).toBeFalsy();
  });
});
