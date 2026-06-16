import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/tenant";
import {
  getTenantDetail,
  updateTenantStatus,
  extendTrial,
  grantFreeMonths,
  changeTenantPlan,
  convertTrialToPaid,
  updateTenantLimits,
  resetTenantOwnerPassword,
  softDeleteTenant,
} from "@/services/admin-service";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

const updateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "EXPIRED", "CANCELLED"]),
  }),
  z.object({
    action: z.literal("extend_trial"),
    days: z.coerce.number().min(1).max(365),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("grant_free_months"),
    months: z.coerce.number().min(1).max(36),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("convert_to_paid"),
    plan: z.enum(["BASIC", "PROFESSIONAL", "ENTERPRISE"]),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("change_plan"),
    plan: z.enum(["BASIC", "PROFESSIONAL", "ENTERPRISE"]),
  }),
  z.object({
    action: z.literal("update_limits"),
    maxUsers: z.coerce.number().min(1).max(9999).optional(),
    maxCases: z.coerce.number().min(1).max(99999).optional(),
    maxStorageGB: z.coerce.number().min(1).max(10000).optional(),
  }),
  z.object({
    action: z.literal("reset_password"),
    newPassword: z.string().min(8).max(72),
  }),
]);

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const item = await getTenantDetail(id);
    if (!item) return apiError("المكتب غير موجود", 404);
    return apiSuccess(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    if (data.action === "status") {
      const updated = await updateTenantStatus(id, data.status);
      return apiSuccess(updated);
    }
    if (data.action === "extend_trial") {
      const updated = await extendTrial(id, data.days, admin.id, data.reason);
      if (!updated) return apiError("المكتب غير موجود", 404);
      return apiSuccess(updated);
    }
    if (data.action === "grant_free_months") {
      const updated = await grantFreeMonths(
        id,
        data.months,
        admin.id,
        data.reason,
      );
      if (!updated) return apiError("المكتب غير موجود", 404);
      return apiSuccess(updated);
    }
    if (data.action === "convert_to_paid") {
      const updated = await convertTrialToPaid(
        id,
        data.plan,
        admin.id,
        data.reason,
      );
      if (!updated) return apiError("المكتب غير موجود", 404);
      return apiSuccess(updated);
    }
    if (data.action === "change_plan") {
      const updated = await changeTenantPlan(id, data.plan);
      return apiSuccess(updated);
    }
    if (data.action === "update_limits") {
      const updated = await updateTenantLimits(id, data);
      return apiSuccess(updated);
    }
    if (data.action === "reset_password") {
      const hash = await bcrypt.hash(data.newPassword, 10);
      const result = await resetTenantOwnerPassword(id, hash);
      if (!result)
        return apiError("لا يوجد مدير مكتب لإعادة تعيين كلمة مروره", 404);
      return apiSuccess({ ok: true });
    }
    return apiError("إجراء غير معروف", 400);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const result = await softDeleteTenant(id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
