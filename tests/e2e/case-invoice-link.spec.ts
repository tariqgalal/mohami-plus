/**
 * E2E: case value should flow into invoice creation, and case detail
 * should expose linked invoices summary.
 */
import { expect, test } from "@playwright/test";
import { ACCOUNTS, apiLogin, getOneClientId } from "./_helpers";

test.describe("Case ↔ Invoice link", () => {
  test("case value is exposed via API for invoice form auto-fill", async ({
    request,
  }) => {
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const clientId = await getOneClientId(request);
    expect(clientId).toBeTruthy();

    // Create case with explicit value
    const caseRes = await request.post("/api/cases", {
      data: {
        title: "اختبار ربط القيمة",
        caseType: "COMMERCIAL",
        court: "المحكمة التجارية",
        clientId,
        primaryLawyerId: (await request.get("/api/team?limit=1").then((r) => r.json())).data
          .items[0].id,
        value: 25000,
      },
    });
    expect(caseRes.status()).toBe(201);
    const caseJson = await caseRes.json();
    const caseId = caseJson.data.id as string;

    // Re-fetch — value should be present
    const detailRes = await request.get(`/api/cases/${caseId}`);
    expect(detailRes.ok()).toBeTruthy();
    const detail = (await detailRes.json()).data;
    expect(Number(detail.value)).toBe(25000);
    expect(Array.isArray(detail.invoices)).toBe(true);

    // Cleanup
    await request.delete(`/api/cases/${caseId}`);
  });
});
