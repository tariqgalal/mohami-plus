-- Phase 4.5 manual migration
-- Adds: Invoice.publicToken, Invoice.sentAt, Invoice.sentTo, Attachment table.
-- Safe to re-run (uses IF NOT EXISTS).

-- 1. Invoice public sharing / send tracking
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "publicToken" TEXT,
  ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sentTo" TEXT;

-- Unique index on publicToken
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_publicToken_key"
  ON "Invoice"("publicToken")
  WHERE "publicToken" IS NOT NULL;

-- 2. Attachment type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttachmentType') THEN
    CREATE TYPE "AttachmentType" AS ENUM ('UPLOAD', 'LINK');
  END IF;
END$$;

-- 3. Attachment table
CREATE TABLE IF NOT EXISTS "Attachment" (
  "id"          TEXT NOT NULL,
  "type"        "AttachmentType" NOT NULL,
  "storagePath" TEXT,
  "fileName"    TEXT,
  "fileSize"    INTEGER,
  "mimeType"    TEXT,
  "url"         TEXT,
  "label"       TEXT,
  "caseId"      TEXT,
  "clientId"    TEXT,
  "invoiceId"   TEXT,
  "sessionId"   TEXT,
  "meetingId"   TEXT,
  "tenantId"    TEXT NOT NULL,
  "uploadedBy"  TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Attachment_tenantId_idx"   ON "Attachment"("tenantId");
CREATE INDEX IF NOT EXISTS "Attachment_caseId_idx"     ON "Attachment"("caseId");
CREATE INDEX IF NOT EXISTS "Attachment_clientId_idx"   ON "Attachment"("clientId");
CREATE INDEX IF NOT EXISTS "Attachment_invoiceId_idx"  ON "Attachment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Attachment_sessionId_idx"  ON "Attachment"("sessionId");
CREATE INDEX IF NOT EXISTS "Attachment_meetingId_idx"  ON "Attachment"("meetingId");

-- Verify
SELECT 'Migration completed' AS status;
