import { after } from "next/server";
import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export type { NotificationType };

/** فئات الإشعارات التي يمكن للمستخدم إيقافها من الإعدادات */
export type NotificationCategory =
  | "tasks"
  | "sessions"
  | "cases"
  | "messages"
  | "invoices"
  | "leaves";

/** ربط كل نوع إشعار بالفئة التي تتحكّم فيه (أنواع غير مذكورة = دائماً مفعّلة) */
const TYPE_CATEGORY: Partial<Record<NotificationType, NotificationCategory>> = {
  TASK_ASSIGNED: "tasks",
  TASK_DUE_SOON: "tasks",
  TASK_OVERDUE: "tasks",
  TASK_COMPLETED: "tasks",
  SESSION_REMINDER: "sessions",
  SESSION_TOMORROW: "sessions",
  SESSION_CREATED: "sessions",
  CASE_STATUS_CHANGED: "cases",
  CASE_ASSIGNED: "cases",
  INVOICE_CREATED: "invoices",
  INVOICE_DUE: "invoices",
  MESSAGE_RECEIVED: "messages",
  LEAVE_REQUEST: "leaves",
  LEAVE_APPROVED: "leaves",
  LEAVE_REJECTED: "leaves",
};

export const NOTIFICATION_CATEGORY_LABELS: Record<
  NotificationCategory,
  string
> = {
  tasks: "إشعارات المهام (تكليف، تذكير، تأخر)",
  sessions: "تذكير الجلسات (قبل يوم + قبل ساعة)",
  cases: "تحديثات القضايا",
  messages: "الرسائل الداخلية",
  invoices: "الفواتير المستحقة",
  leaves: "طلبات الإجازة",
};

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  tasks: true,
  sessions: true,
  cases: true,
  messages: true,
  invoices: true,
  leaves: true,
};

export function normalizePreferences(raw: unknown): NotificationPreferences {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const key of Object.keys(prefs) as NotificationCategory[]) {
      const value = (raw as Record<string, unknown>)[key];
      if (typeof value === "boolean") prefs[key] = value;
    }
  }
  return prefs;
}

export interface CreateNotificationParams {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  relatedId?: string;
  relatedType?: string;
}

/**
 * ينفّذ عملاً في الخلفية بدون تعطيل الاستجابة عند توفّر `after()` من Next،
 * ويرجع للتنفيذ المباشر خارج سياق الطلب (سكربتات / اختبارات).
 */
function runInBackground(work: () => Promise<void>) {
  const safe = () =>
    work().catch((e) => console.error("[notification] background task", e));
  try {
    after(safe);
  } catch {
    // خارج سياق طلب Next (سكربت / اختبار) — نفّذ مباشرة بدون انتظار
    void safe();
  }
}

/** يستبعد المستخدمين الذين أوقفوا فئة هذا الإشعار من إعداداتهم */
async function filterByPreferences(
  userIds: string[],
  type: NotificationType,
): Promise<string[]> {
  const category = TYPE_CATEGORY[type];
  if (!category || userIds.length === 0) return userIds;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, notificationPreferences: true },
  });

  const allowed = new Set(
    users
      .filter((u) => normalizePreferences(u.notificationPreferences)[category])
      .map((u) => u.id),
  );
  return userIds.filter((id) => allowed.has(id));
}

/**
 * المكان الوحيد لإنشاء الإشعارات: يحفظ الإشعار الداخلي ثم يرسل Push
 * لكل أجهزة المستخدم في الخلفية.
 */
export async function createNotification(params: CreateNotificationParams) {
  const [allowedUserId] = await filterByPreferences(
    [params.userId],
    params.type,
  );
  if (!allowedUserId) return null;

  const notification = await prisma.notification.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link ?? null,
      relatedId: params.relatedId ?? null,
      relatedType: params.relatedType ?? null,
    },
  });

  runInBackground(() =>
    sendPushToUser(params.userId, {
      title: params.title,
      body: params.body,
      url: params.link || "/dashboard",
      tag: params.type,
    }),
  );

  return notification;
}

/** إنشاء نفس الإشعار لعدة مستخدمين (مثلاً كل فريق القضية) */
export async function createNotificationForMany(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">,
) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return [];

  const allowed = await filterByPreferences(unique, params.type);
  if (allowed.length === 0) return [];

  await prisma.notification.createMany({
    data: allowed.map((userId) => ({
      tenantId: params.tenantId,
      userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link ?? null,
      relatedId: params.relatedId ?? null,
      relatedType: params.relatedType ?? null,
    })),
  });

  runInBackground(async () => {
    await Promise.allSettled(
      allowed.map((userId) =>
        sendPushToUser(userId, {
          title: params.title,
          body: params.body,
          url: params.link || "/dashboard",
          tag: params.type,
        }),
      ),
    );
  });

  return allowed;
}

// ============ استعلامات ============

export async function listUserNotifications(
  userId: string,
  tenantId: string,
  options: { unreadOnly?: boolean; limit?: number; skip?: number } = {},
) {
  const { unreadOnly = false, limit = 50, skip = 0 } = options;
  return prisma.notification.findMany({
    where: { userId, tenantId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
  });
}

export async function countUserNotifications(
  userId: string,
  tenantId: string,
  options: { unreadOnly?: boolean } = {},
) {
  return prisma.notification.count({
    where: {
      userId,
      tenantId,
      ...(options.unreadOnly ? { isRead: false } : {}),
    },
  });
}

export async function getUnreadCount(userId: string, tenantId: string) {
  return prisma.notification.count({
    where: { userId, tenantId, isRead: false },
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

export async function markAllAsRead(userId: string, tenantId: string) {
  return prisma.notification.updateMany({
    where: { userId, tenantId, isRead: false },
    data: { isRead: true },
  });
}

export async function deleteNotification(userId: string, id: string) {
  return prisma.notification.deleteMany({ where: { id, userId } });
}

/**
 * يمنع تكرار نفس التذكير: هل أُرسل إشعار بنفس النوع لنفس السجل
 * لنفس المستخدم منذ لحظة معيّنة؟ (تُستخدم من الـ cron)
 */
export async function findAlreadyNotifiedUserIds(
  type: NotificationType,
  relatedId: string,
  since: Date,
): Promise<Set<string>> {
  const rows = await prisma.notification.findMany({
    where: { type, relatedId, createdAt: { gte: since } },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

// ============ محفّزات الموديولات ============
// كلها تبتلع الأخطاء — الإشعار لا يجب أن يُفشل العملية الأصلية.

async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    console.error(`[notification:${label}]`, e);
  }
}

// ---- المهام ----

export async function notifyTaskAssigned(params: {
  tenantId: string;
  taskId: string;
  taskTitle: string;
  assigneeIds: string[];
  assignerName: string;
}) {
  await safely("taskAssigned", () =>
    createNotificationForMany(params.assigneeIds, {
      tenantId: params.tenantId,
      type: "TASK_ASSIGNED",
      title: `مهمة جديدة: ${params.taskTitle}`,
      body: `تم تكليفك بمهمة «${params.taskTitle}» بواسطة ${params.assignerName}`,
      link: `/dashboard/tasks/${params.taskId}`,
      relatedId: params.taskId,
      relatedType: "TASK",
    }),
  );
}

export async function notifyTaskCompleted(params: {
  tenantId: string;
  taskId: string;
  taskTitle: string;
  recipientIds: string[];
  completedByName: string;
}) {
  await safely("taskCompleted", () =>
    createNotificationForMany(params.recipientIds, {
      tenantId: params.tenantId,
      type: "TASK_COMPLETED",
      title: `مهمة مكتملة: ${params.taskTitle}`,
      body: `أكمل ${params.completedByName} المهمة «${params.taskTitle}»`,
      link: `/dashboard/tasks/${params.taskId}`,
      relatedId: params.taskId,
      relatedType: "TASK",
    }),
  );
}

// ---- الجلسات ----

export async function notifySessionCreated(params: {
  tenantId: string;
  sessionId: string;
  caseTitle: string;
  court: string;
  dateLabel: string;
  recipientIds: string[];
}) {
  await safely("sessionCreated", () =>
    createNotificationForMany(params.recipientIds, {
      tenantId: params.tenantId,
      type: "SESSION_CREATED",
      title: `جلسة جديدة: ${params.caseTitle}`,
      body: `تمت إضافة جلسة بتاريخ ${params.dateLabel} في ${params.court}`,
      link: `/dashboard/sessions/${params.sessionId}`,
      relatedId: params.sessionId,
      relatedType: "SESSION",
    }),
  );
}

// ---- القضايا ----

export async function notifyCaseAssigned(params: {
  tenantId: string;
  caseId: string;
  caseTitle: string;
  userIds: string[];
}) {
  await safely("caseAssigned", () =>
    createNotificationForMany(params.userIds, {
      tenantId: params.tenantId,
      type: "CASE_ASSIGNED",
      title: `قضية جديدة: ${params.caseTitle}`,
      body: `تم تعيينك محامياً مسؤولاً عن قضية «${params.caseTitle}»`,
      link: `/dashboard/cases/${params.caseId}`,
      relatedId: params.caseId,
      relatedType: "CASE",
    }),
  );
}

export async function notifyCaseStatusChanged(params: {
  tenantId: string;
  caseId: string;
  caseTitle: string;
  oldStatusLabel: string;
  newStatusLabel: string;
  userIds: string[];
}) {
  await safely("caseStatusChanged", () =>
    createNotificationForMany(params.userIds, {
      tenantId: params.tenantId,
      type: "CASE_STATUS_CHANGED",
      title: `تحديث قضية: ${params.caseTitle}`,
      body: `تغيرت حالة القضية من «${params.oldStatusLabel}» إلى «${params.newStatusLabel}»`,
      link: `/dashboard/cases/${params.caseId}`,
      relatedId: params.caseId,
      relatedType: "CASE",
    }),
  );
}

// ---- المراسلات الداخلية ----

export async function notifyMessageReceived(params: {
  tenantId: string;
  correspondenceId: string;
  senderName: string;
  preview: string;
  recipientIds: string[];
}) {
  const preview =
    params.preview.length > 100
      ? `${params.preview.slice(0, 100)}...`
      : params.preview;
  await safely("messageReceived", () =>
    createNotificationForMany(params.recipientIds, {
      tenantId: params.tenantId,
      type: "MESSAGE_RECEIVED",
      title: `رسالة جديدة من ${params.senderName}`,
      body: preview,
      link: `/dashboard/correspondence/${params.correspondenceId}`,
      relatedId: params.correspondenceId,
      relatedType: "MESSAGE",
    }),
  );
}

// ---- الفواتير ----

export async function notifyInvoiceCreated(params: {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  clientName: string;
  recipientIds: string[];
}) {
  await safely("invoiceCreated", () =>
    createNotificationForMany(params.recipientIds, {
      tenantId: params.tenantId,
      type: "INVOICE_CREATED",
      title: `فاتورة جديدة: ${params.invoiceNumber}`,
      body: `تم إنشاء فاتورة بمبلغ ${params.amount.toLocaleString("ar-SA")} ر.س للعميل ${params.clientName}`,
      link: `/dashboard/finance/invoices/${params.invoiceId}`,
      relatedId: params.invoiceId,
      relatedType: "INVOICE",
    }),
  );
}

export async function notifyInvoiceDue(params: {
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  recipientIds: string[];
  overdue?: boolean;
}) {
  await safely("invoiceDue", () =>
    createNotificationForMany(params.recipientIds, {
      tenantId: params.tenantId,
      type: "INVOICE_DUE",
      title: params.overdue ? "فاتورة متأخرة" : "فاتورة مستحقة اليوم",
      body: `الفاتورة ${params.invoiceNumber} بقيمة ${params.amount.toLocaleString("ar-SA")} ر.س ${
        params.overdue ? "تجاوزت موعد الاستحقاق" : "مستحقة السداد اليوم"
      }`,
      link: `/dashboard/finance/invoices/${params.invoiceId}`,
      relatedId: params.invoiceId,
      relatedType: "INVOICE",
    }),
  );
}

// ---- الوكالات ----

export async function notifyPoaCreated(params: {
  tenantId: string;
  poaId: string;
  poaNumber: string;
  clientName: string;
  recipientIds: string[];
}) {
  await safely("poaCreated", () =>
    createNotificationForMany(params.recipientIds, {
      tenantId: params.tenantId,
      type: "GENERAL",
      title: "وكالة جديدة",
      body: `تم إنشاء الوكالة رقم ${params.poaNumber} للعميل ${params.clientName} وأنت من المخوّلين بها`,
      link: `/dashboard/powers-of-attorney/${params.poaId}`,
      relatedId: params.poaId,
      relatedType: "POA",
    }),
  );
}

// ---- الإجازات ----

export async function notifyLeaveRequested(params: {
  tenantId: string;
  leaveId: string;
  employeeName: string;
  startLabel: string;
  endLabel: string;
  adminIds: string[];
}) {
  await safely("leaveRequested", () =>
    createNotificationForMany(params.adminIds, {
      tenantId: params.tenantId,
      type: "LEAVE_REQUEST",
      title: `طلب إجازة: ${params.employeeName}`,
      body: `طلب ${params.employeeName} إجازة من ${params.startLabel} إلى ${params.endLabel}`,
      link: `/dashboard/hr/leaves/${params.leaveId}`,
      relatedId: params.leaveId,
      relatedType: "LEAVE",
    }),
  );
}

export async function notifyLeaveDecision(params: {
  tenantId: string;
  leaveId: string;
  employeeId: string;
  approved: boolean;
  startLabel: string;
  endLabel: string;
}) {
  await safely("leaveDecision", () =>
    createNotification({
      tenantId: params.tenantId,
      userId: params.employeeId,
      type: params.approved ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      title: params.approved
        ? "تم قبول طلب إجازتك"
        : "تم رفض طلب إجازتك",
      body: `تم ${params.approved ? "قبول" : "رفض"} طلب إجازتك من ${params.startLabel} إلى ${params.endLabel}`,
      link: `/dashboard/hr/leaves/${params.leaveId}`,
      relatedId: params.leaveId,
      relatedType: "LEAVE",
    }),
  );
}

// ---- الاستشارات ----

export async function notifyConsultationCreated(params: {
  tenantId: string;
  consultationId: string;
  title: string;
  typeLabel: string;
  recipientIds: string[];
}) {
  await safely("consultationCreated", () =>
    createNotificationForMany(params.recipientIds, {
      tenantId: params.tenantId,
      type: "CONSULTATION_NEW",
      title: `استشارة جديدة: ${params.title}`,
      body: `تم تسجيل استشارة جديدة — ${params.typeLabel}`,
      link: `/dashboard/consultations/${params.consultationId}`,
      relatedId: params.consultationId,
      relatedType: "CONSULTATION",
    }),
  );
}

// ---- الاجتماعات ----

export async function notifyMeetingCreated(params: {
  tenantId: string;
  meetingId: string;
  title: string;
  dateLabel: string;
  time: string;
  attendeeIds: string[];
}) {
  await safely("meetingCreated", () =>
    createNotificationForMany(params.attendeeIds, {
      tenantId: params.tenantId,
      type: "MEETING_REMINDER",
      title: `اجتماع جديد: ${params.title}`,
      body: `تم جدولة اجتماع بتاريخ ${params.dateLabel} الساعة ${params.time}`,
      link: `/dashboard/meetings/${params.meetingId}`,
      relatedId: params.meetingId,
      relatedType: "MEETING",
    }),
  );
}

/**
 * يمرّ على الفواتير التي تجاوزت موعد استحقاقها ولم تُعلَّم كمتأخرة،
 * يحدّث حالتها ويُشعر مديري المكتب المالك.
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
    where: { tenantId: { in: tenantIds }, role: "FIRM_ADMIN", isActive: true },
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
    if (recipients.length === 0) continue;
    const remaining = Math.max(
      0,
      +(Number(inv.totalAmount) - Number(inv.paidAmount)).toFixed(2),
    );
    await notifyInvoiceDue({
      tenantId: inv.tenantId,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: remaining,
      recipientIds: recipients,
      overdue: true,
    });
    notified += recipients.length;
  }

  return { updated: candidates.length, notified };
}
