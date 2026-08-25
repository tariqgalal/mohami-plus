-- Phase 13: تحسينات الوكالات — ربط الموظفين والقضايا والتنفيذ والاستشارات
ALTER TABLE "PowerOfAttorney"
  ADD COLUMN IF NOT EXISTS "employeeIds" JSONB,
  ADD COLUMN IF NOT EXISTS "caseIds" JSONB,
  ADD COLUMN IF NOT EXISTS "executionIds" JSONB,
  ADD COLUMN IF NOT EXISTS "consultationIds" JSONB;
