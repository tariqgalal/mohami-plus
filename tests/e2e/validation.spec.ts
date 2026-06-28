/**
 * Validation E2E tests — Saudi mobile + email validators.
 *
 * Verifies that the API rejects invalid contact data with Arabic error messages
 * and accepts the same number in multiple input forms, normalizing to +9665XXXXXXXX.
 */
import { expect, test } from "@playwright/test";
import { ACCOUNTS, apiLogin } from "./_helpers";

test.describe("Validation — Saudi mobile + email", () => {
  test.beforeEach(async ({ request }) => {
    await apiLogin(request, ACCOUNTS.firmA.email, ACCOUNTS.firmA.password);
  });

  test("rejects 5-digit phone with Arabic message", async ({ request }) => {
    const res = await request.post("/api/clients", {
      data: {
        name: "اختبار جوال قصير",
        clientType: "INDIVIDUAL",
        phone: "12345",
        city: "الرياض",
      },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    const msg = String(json.error || "").toLowerCase();
    // Either explicit Arabic phrase or our exact wording
    expect(msg).toMatch(/جوال|غير صحيح|966/);
  });

  test("rejects malformed email", async ({ request }) => {
    const res = await request.post("/api/clients", {
      data: {
        name: "اختبار إيميل غلط",
        clientType: "INDIVIDUAL",
        phone: "0501234567",
        email: "notanemail",
        city: "الرياض",
      },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test("accepts multiple phone formats and stores normalized form", async ({
    request,
  }) => {
    const variants = [
      "0501234599",
      "0 5 0 - 1 2 3 4 5 9 9",
      "+966501234599",
      "00966501234599",
    ];
    const created: string[] = [];
    for (const phone of variants) {
      const res = await request.post("/api/clients", {
        data: {
          name: `اختبار صيغة ${variants.indexOf(phone)}`,
          clientType: "INDIVIDUAL",
          phone,
          city: "الرياض",
        },
      });
      expect(res.status(), `phone=${phone}`).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.phone).toBe("+966501234599");
      created.push(json.data.id);
    }
    // cleanup
    for (const id of created) {
      await request.delete(`/api/clients/${id}`);
    }
  });

  test("rejects Arabic letters in email domain", async ({ request }) => {
    const res = await request.post("/api/clients", {
      data: {
        name: "اختبار إيميل عربي",
        clientType: "INDIVIDUAL",
        phone: "0501234567",
        email: "user@إيميل.com",
        city: "الرياض",
      },
    });
    expect(res.status()).toBe(400);
  });
});
