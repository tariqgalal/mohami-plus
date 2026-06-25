import { test, expect, request as pwRequest } from "@playwright/test";
import { ACCOUNTS, apiLogin } from "./_helpers";

const RESOURCES = [
  { path: "cases", label: "القضايا" },
  { path: "clients", label: "العملاء" },
  { path: "sessions", label: "الجلسات" },
  { path: "invoices", label: "الفواتير" },
  { path: "documents", label: "المستندات" },
  { path: "meetings", label: "الاجتماعات" },
  { path: "team", label: "الفريق" },
] as const;

test.describe("Tenant Isolation — عزل البيانات بين المكاتب (CRITICAL)", () => {
  test("مكتب B لا يقدر يفتح قضية بتاعة مكتب A بالـ ID", async ({
    playwright,
    baseURL,
  }) => {
    // كأن A
    const ctxA = await playwright.request.newContext({ baseURL });
    await apiLogin(ctxA, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const resA = await ctxA.get("/api/cases?limit=1");
    expect(resA.ok()).toBeTruthy();
    const jsonA = await resA.json();
    const itemsA = jsonA?.data?.items ?? jsonA?.data?.data ?? [];
    const firstCase = Array.isArray(itemsA) ? itemsA[0] : itemsA.items?.[0];
    test.skip(!firstCase?.id, "ما فيش قضايا في مكتب A للاختبار");
    const caseId = firstCase.id;
    await ctxA.dispose();

    // كأن B
    const ctxB = await playwright.request.newContext({ baseURL });
    await apiLogin(ctxB, ACCOUNTS.firmB.email, ACCOUNTS.firmB.password);
    const crossRead = await ctxB.get(`/api/cases/${caseId}`, {
      failOnStatusCode: false,
    });
    expect(
      [403, 404].includes(crossRead.status()),
      `مكتب B قدر يقرأ قضية مكتب A عبر ${caseId}`,
    ).toBeTruthy();

    const crossUpdate = await ctxB.put(`/api/cases/${caseId}`, {
      data: { title: "محاولة اختراق" },
      failOnStatusCode: false,
    });
    expect([403, 404, 400]).toContain(crossUpdate.status());

    const crossDelete = await ctxB.delete(`/api/cases/${caseId}`, {
      failOnStatusCode: false,
    });
    expect([403, 404]).toContain(crossDelete.status());

    await ctxB.dispose();
  });

  for (const r of RESOURCES) {
    test(`القائمة في ${r.label} لا تخلط بيانات بين مكتبين`, async ({
      playwright,
      baseURL,
    }) => {
      const ctxA = await playwright.request.newContext({ baseURL });
      await apiLogin(ctxA, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
      const aRes = await ctxA.get(`/api/${r.path}?limit=50`);
      const aJson = aRes.ok() ? await aRes.json() : null;
      const aItems = extractItems(aJson);
      const aIds = new Set(aItems.map((i: { id: string }) => i.id));
      await ctxA.dispose();

      const ctxB = await playwright.request.newContext({ baseURL });
      await apiLogin(ctxB, ACCOUNTS.firmB.email, ACCOUNTS.firmB.password);
      const bRes = await ctxB.get(`/api/${r.path}?limit=50`);
      const bJson = bRes.ok() ? await bRes.json() : null;
      const bItems = extractItems(bJson);
      const overlap = bItems.filter((i: { id: string }) => aIds.has(i.id));
      await ctxB.dispose();

      expect(
        overlap.length,
        `لقينا تسرب بيانات في ${r.label}: ${overlap.length} سجل مشترك`,
      ).toBe(0);
    });
  }

  test("البحث الشامل ما يرجّعش بيانات مكاتب تانية", async ({
    playwright,
    baseURL,
  }) => {
    const ctxA = await playwright.request.newContext({ baseURL });
    await apiLogin(ctxA, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
    const aRes = await ctxA.get("/api/cases?limit=1");
    const aJson = aRes.ok() ? await aRes.json() : null;
    const aFirst = extractItems(aJson)[0] as { title?: string; id?: string } | undefined;
    test.skip(!aFirst?.title, "ما فيش بيانات للبحث");
    const term = aFirst!.title!.slice(0, 4);
    await ctxA.dispose();

    const ctxB = await playwright.request.newContext({ baseURL });
    await apiLogin(ctxB, ACCOUNTS.firmB.email, ACCOUNTS.firmB.password);
    const bRes = await ctxB.get(`/api/search?q=${encodeURIComponent(term)}`);
    if (bRes.ok()) {
      const bJson = await bRes.json();
      const bAll = JSON.stringify(bJson);
      expect(
        bAll.includes(aFirst!.id ?? ""),
        "البحث في مكتب B رجّع id من بيانات مكتب A",
      ).toBeFalsy();
    }
    await ctxB.dispose();
  });
});

function extractItems(json: unknown): { id: string }[] {
  if (!json || typeof json !== "object") return [];
  const data = (json as { data?: unknown }).data;
  if (Array.isArray(data)) return data as { id: string }[];
  if (data && typeof data === "object") {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items as { id: string }[];
    const nested = (data as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as { id: string }[];
  }
  return [];
}
