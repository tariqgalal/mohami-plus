import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getTenantId } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { getFinanceStats } from "@/services/invoice-service";
import { scanAndNotifyOverdueInvoices } from "@/services/notification-service";

// Throttle per-tenant overdue scan so finance dashboard loads stay cheap.
const lastScanByTenant = new Map<string, number>();
const SCAN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function maybeScanOverdue(tenantId: string) {
  const last = lastScanByTenant.get(tenantId) ?? 0;
  if (Date.now() - last < SCAN_INTERVAL_MS) return;
  lastScanByTenant.set(tenantId, Date.now());
  try {
    await requirePermission("FINANCE_READ");
    await scanAndNotifyOverdueInvoices({ tenantId });
  } catch (e) {
    console.error("[overdue-scan]", e);
  }
}

export async function GET() {
  try {
    const tenantId = await getTenantId();
    await maybeScanOverdue(tenantId);
    const stats = await getFinanceStats(tenantId);
    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
