-- CreateEnum
CREATE TYPE "JudgmentLevel" AS ENUM ('FIRST_INSTANCE', 'APPEAL', 'SUPREME');

-- CreateEnum
CREATE TYPE "JudgmentResult" AS ENUM ('IN_FAVOR', 'AGAINST', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ObjectionStatus" AS ENUM ('PRE_FILING', 'PENDING', 'NO_OBJECTION', 'OBJECTED');

-- CreateTable
CREATE TABLE "CourtJudgment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "caseTitle" TEXT NOT NULL,
    "judgmentLevel" "JudgmentLevel" NOT NULL DEFAULT 'FIRST_INSTANCE',
    "judgmentResult" "JudgmentResult" NOT NULL DEFAULT 'PARTIAL',
    "judgmentSummary" TEXT,
    "receiveDate" TIMESTAMP(3),
    "receiveDateHijri" TEXT,
    "objectionStatus" "ObjectionStatus" NOT NULL DEFAULT 'PENDING',
    "objectionDeadline" TIMESTAMP(3),
    "notes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "CourtJudgment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourtJudgment_tenantId_idx" ON "CourtJudgment"("tenantId");

-- CreateIndex
CREATE INDEX "CourtJudgment_tenantId_objectionStatus_idx" ON "CourtJudgment"("tenantId", "objectionStatus");

-- CreateIndex
CREATE INDEX "CourtJudgment_tenantId_caseId_idx" ON "CourtJudgment"("tenantId", "caseId");

-- AddForeignKey
ALTER TABLE "CourtJudgment" ADD CONSTRAINT "CourtJudgment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
