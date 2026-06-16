import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "SESSION_REMINDER"
  | "SESSION_CREATED"
  | "INVOICE_OVERDUE"
  | "CASE_ASSIGNED"
  | "CASE_UPDATED"
  | "GENERAL";

export interface NotificationData {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

export async function createNotification(input: NotificationData) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      data: input.data ? JSON.stringify(input.data) : null,
    },
  });
}

export async function createNotifications(inputs: NotificationData[]) {
  if (inputs.length === 0) return { count: 0 };
  return prisma.notification.createMany({
    data: inputs.map((n) => ({
      userId: n.userId,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data ? JSON.stringify(n.data) : null,
    })),
  });
}

export async function listUserNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {},
) {
  const { unreadOnly = false, limit = 50 } = options;
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAsRead(userId: string, ids?: string[]) {
  return prisma.notification.updateMany({
    where: {
      userId,
      ...(ids && ids.length ? { id: { in: ids } } : {}),
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function deleteNotification(userId: string, id: string) {
  return prisma.notification.deleteMany({
    where: { id, userId },
  });
}

/**
 * Trigger helpers — fired from services after entity mutations.
 * They swallow errors to never break the parent operation.
 */
export async function notifySessionCreated(
  sessionId: string,
  lawyerId: string,
  caseTitle: string,
  dateStr: string,
) {
  try {
    await createNotification({
      userId: lawyerId,
      title: "جلسة جديدة أُسندت إليك",
      body: `قضية: ${caseTitle} — موعد ${dateStr}`,
      type: "SESSION_CREATED",
      data: { sessionId, link: `/dashboard/sessions/${sessionId}` },
    });
  } catch (e) {
    console.error("[notifySessionCreated]", e);
  }
}

export async function notifyCaseAssigned(
  caseId: string,
  caseTitle: string,
  userIds: string[],
) {
  try {
    if (!userIds.length) return;
    await createNotifications(
      userIds.map((userId) => ({
        userId,
        title: "قضية جديدة أُسندت إليك",
        body: caseTitle,
        type: "CASE_ASSIGNED" as const,
        data: { caseId, link: `/dashboard/cases/${caseId}` },
      })),
    );
  } catch (e) {
    console.error("[notifyCaseAssigned]", e);
  }
}

export async function notifyCaseStatusChanged(
  caseId: string,
  caseTitle: string,
  newStatus: string,
  userIds: string[],
) {
  try {
    if (!userIds.length) return;
    await createNotifications(
      userIds.map((userId) => ({
        userId,
        title: "تحديث على قضية",
        body: `${caseTitle} — الحالة الجديدة: ${newStatus}`,
        type: "CASE_UPDATED" as const,
        data: { caseId, link: `/dashboard/cases/${caseId}` },
      })),
    );
  } catch (e) {
    console.error("[notifyCaseStatusChanged]", e);
  }
}

export async function notifyInvoiceOverdue(
  invoiceId: string,
  invoiceNumber: string,
  amount: number,
  firmAdminIds: string[],
) {
  try {
    if (!firmAdminIds.length) return;
    await createNotifications(
      firmAdminIds.map((userId) => ({
        userId,
        title: "فاتورة متأخرة",
        body: `الفاتورة ${invoiceNumber} بقيمة ${amount.toLocaleString("ar-SA")} ر.س تجاوزت موعد الاستحقاق`,
        type: "INVOICE_OVERDUE" as const,
        data: { invoiceId, link: `/dashboard/finance/invoices` },
      })),
    );
  } catch (e) {
    console.error("[notifyInvoiceOverdue]", e);
  }
}

/**
 * Scan for invoices past their due date that aren't yet marked OVERDUE,
 * flip their status, and notify firm admins of the owning tenant.
 * Safe to call from a cron route or lazily from the dashboard.
 */
export async function scanAndNotifyOverdueInvoices(scope?: {
  tenantId?: string;
}) {
  const now = new Date();
  const candidates = await prisma.invoice.findMany({
    where: {
      ...(scope?.tenantId ? { tenantId: scope.tenantId } : {}),
      status: { in: ["SENT", "PARTIAL"] },
      dueDate: { lt: now },
    },
    select: {
      id: true,
      tenantId: true,
      invoiceNumber: true,
      totalAmount: true,
      paidAmount: true,
    },
  });

  if (candidates.length === 0) return { updated: 0, notified: 0 };

  const tenantIds = Array.from(new Set(candidates.map((i) => i.tenantId)));
  const admins = await prisma.user.findMany({
    where: {
      tenantId: { in: tenantIds },
      role: "FIRM_ADMIN",
      isActive: true,
    },
    select: { id: true, tenantId: true },
  });
  const adminsByTenant = new Map<string, string[]>();
  for (const a of admins) {
    if (!a.tenantId) continue;
    const arr = adminsByTenant.get(a.tenantId) ?? [];
    arr.push(a.id);
    adminsByTenant.set(a.tenantId, arr);
  }

  await prisma.invoice.updateMany({
    where: { id: { in: candidates.map((i) => i.id) } },
    data: { status: "OVERDUE" },
  });

  let notified = 0;
  for (const inv of candidates) {
    const recipients = adminsByTenant.get(inv.tenantId) ?? [];
    const remaining = Math.max(
      0,
      +(Number(inv.totalAmount) - Number(inv.paidAmount)).toFixed(2),
    );
    await notifyInvoiceOverdue(
      inv.id,
      inv.invoiceNumber,
      remaining,
      recipients,
    );
    notified += recipients.length;
  }

  return { updated: candidates.length, notified };
}
