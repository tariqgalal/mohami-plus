import { NextRequest } from "next/server";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import {
  getFileUrl,
  isStorageConfigured,
  pathBelongsToTenant,
} from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("DOCUMENT_READ");
    const tenantId = await getTenantId();
    const filePath = req.nextUrl.searchParams.get("path");
    if (!filePath) return apiError("مسار الملف مطلوب", 400);

    // الـ paths القديمة (/uploads/...) بتُعرض كما هي من /public؛ ما تحتاجش signing
    if (filePath.startsWith("/uploads/")) {
      return apiSuccess({ url: filePath });
    }

    if (!isStorageConfigured()) {
      return apiError("خدمة الملفات غير متاحة حالياً", 503);
    }

    if (!pathBelongsToTenant(filePath, tenantId)) {
      return apiError("غير مصرّح بالوصول لهذا الملف", 403);
    }

    const url = await getFileUrl(filePath);
    return apiSuccess({ url });
  } catch (e) {
    return handleApiError(e);
  }
}
