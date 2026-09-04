-- ============================================================
-- نظام الإشعارات الشامل: إعادة تشكيل جدول Notification + جدول اشتراكات Push
-- ============================================================

-- 1) نوع الإشعار كـ enum
CREATE TYPE "NotificationType" AS ENUM (
  'TASK_ASSIGNED',
  'TASK_DUE_SOON',
  'TASK_OVERDUE',
  'TASK_COMPLETED',
  'SESSION_REMINDER',
  'SESSION_TOMORROW',
  'SESSION_CREATED',
  'CASE_STATUS_CHANGED',
  'CASE_ASSIGNED',
  'INVOICE_CREATED',
  'INVOICE_DUE',
  'MESSAGE_RECEIVED',
  'POA_EXPIRING',
  'LEAVE_REQUEST',
  'LEAVE_APPROVED',
  'LEAVE_REJECTED',
  'CONSULTATION_NEW',
  'MEETING_REMINDER',
  'GENERAL'
);

-- 2) الأعمدة الجديدة
ALTER TABLE "Notification" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "link" TEXT;
ALTER TABLE "Notification" ADD COLUMN "relatedId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "relatedType" TEXT;

-- 3) ترحيل الرابط من عمود data (كان JSON نصّي فيه { link })
UPDATE "Notification"
SET "link" = ("data"::jsonb ->> 'link')
WHERE "data" IS NOT NULL AND "data" ~ '^\s*\{';

-- 4) ترحيل tenantId من المستخدم المالك للإشعار
UPDATE "Notification" n
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE u."id" = n."userId" AND u."tenantId" IS NOT NULL;

-- إشعارات بلا مكتب (مستخدم محذوف أو Super Admin) لا مكان لها في نظام معزول بالمكاتب
DELETE FROM "Notification" WHERE "tenantId" IS NULL;

ALTER TABLE "Notification" ALTER COLUMN "tenantId" SET NOT NULL;

-- 5) تحويل عمود type من TEXT إلى enum مع تعيين القيم القديمة
ALTER TABLE "Notification" ADD COLUMN "type_enum" "NotificationType" NOT NULL DEFAULT 'GENERAL';

UPDATE "Notification" SET "type_enum" = CASE "type"
  WHEN 'SESSION_REMINDER' THEN 'SESSION_REMINDER'::"NotificationType"
  WHEN 'SESSION_CREATED'  THEN 'SESSION_CREATED'::"NotificationType"
  WHEN 'CASE_ASSIGNED'    THEN 'CASE_ASSIGNED'::"NotificationType"
  WHEN 'CASE_UPDATED'     THEN 'CASE_STATUS_CHANGED'::"NotificationType"
  WHEN 'INVOICE_OVERDUE'  THEN 'INVOICE_DUE'::"NotificationType"
  ELSE 'GENERAL'::"NotificationType"
END;

ALTER TABLE "Notification" DROP COLUMN "type";
ALTER TABLE "Notification" RENAME COLUMN "type_enum" TO "type";
ALTER TABLE "Notification" ALTER COLUMN "type" DROP DEFAULT;

-- 6) عمود data لم يعد مستخدماً (استُبدل بـ link/relatedId/relatedType)
ALTER TABLE "Notification" DROP COLUMN "data";

-- 7) الفهارس والعلاقات
DROP INDEX IF EXISTS "Notification_userId_idx";
DROP INDEX IF EXISTS "Notification_isRead_idx";
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_relatedId_type_idx" ON "Notification"("relatedId", "type");

-- الإشعارات بلا مستخدم موجود تمنع إنشاء المفتاح الأجنبي
DELETE FROM "Notification" n WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = n."userId");

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8) تفضيلات الإشعارات لكل مستخدم
ALTER TABLE "User" ADD COLUMN "notificationPreferences" JSONB;

-- 9) اشتراكات Web Push
CREATE TABLE "PushSubscription" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "endpoint"  TEXT NOT NULL,
  "p256dh"    TEXT NOT NULL,
  "auth"      TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

ALTER TABLE "PushSubscription"
  ADD CONSTRAINT "PushSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
