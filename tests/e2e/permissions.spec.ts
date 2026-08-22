import { test, expect } from "@playwright/test";
import { assertRolePermission, hasPermission, PermissionDeniedError } from "@/lib/permissions-core";

test.describe("RBAC — صلاحيات المكتب", () => {
  test("الأدوار غير المسموحة تُترجم إلى HTTP 403", () => {
    expect(() => assertRolePermission("SECRETARY", "INVOICE_MANAGE")).toThrow(PermissionDeniedError);
    try {
      assertRolePermission("SECRETARY", "INVOICE_MANAGE");
    } catch (error) {
      expect((error as PermissionDeniedError).status).toBe(403);
    }
  });

  test("المحاسب يدير المالية دون صلاحيات قانونية أو إدارية", () => {
    expect(hasPermission("ACCOUNTANT", "INVOICE_MANAGE")).toBe(true);
    expect(hasPermission("ACCOUNTANT", "REPORTS_READ")).toBe(true);
    expect(hasPermission("ACCOUNTANT", "CASE_UPDATE")).toBe(false);
    expect(hasPermission("ACCOUNTANT", "TEAM_MANAGE")).toBe(false);
  });

  test("المتدرب قارئ قانوني ويمكنه رفع مستند دون إدارة السجلات", () => {
    expect(hasPermission("TRAINEE", "CASE_READ")).toBe(true);
    expect(hasPermission("TRAINEE", "DOCUMENT_UPLOAD")).toBe(true);
    expect(hasPermission("TRAINEE", "CASE_UPDATE")).toBe(false);
  });
});
