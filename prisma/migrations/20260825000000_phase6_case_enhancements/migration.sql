-- Phase 6: تحسينات القضايا
-- حالات جديدة للقضية
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'PRE_FILING';

-- حقول جديدة على القضية + الأرشفة
ALTER TABLE "Case"
  ADD COLUMN IF NOT EXISTS "classification" TEXT,
  ADD COLUMN IF NOT EXISTS "lawsuitType" TEXT,
  ADD COLUMN IF NOT EXISTS "branch" TEXT,
  ADD COLUMN IF NOT EXISTS "establishmentTxnNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- فهرس لتسريع فلترة الأرشيف
CREATE INDEX IF NOT EXISTS "Case_tenantId_archivedAt_idx" ON "Case"("tenantId", "archivedAt");
