-- CreateEnum
CREATE TYPE "CorrespondenceCategory" AS ENUM ('DISCUSSIONS', 'TASKS', 'CASES_PROJECTS');

-- CreateEnum
CREATE TYPE "CorrespondenceType" AS ENUM ('CLIENT', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "CorrespondenceDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateTable
CREATE TABLE "Correspondence" (
    "id" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "CorrespondenceCategory" NOT NULL,
    "type" "CorrespondenceType" NOT NULL,
    "direction" "CorrespondenceDirection" NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "recipientIds" JSONB NOT NULL,
    "recipientNames" JSONB NOT NULL,
    "viewedBy" JSONB,
    "attachmentCount" INTEGER NOT NULL DEFAULT 0,
    "attachments" JSONB,
    "dateHijri" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Correspondence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Correspondence_tenantId_idx" ON "Correspondence"("tenantId");

-- CreateIndex
CREATE INDEX "Correspondence_tenantId_type_direction_idx" ON "Correspondence"("tenantId", "type", "direction");

-- CreateIndex
CREATE INDEX "Correspondence_parentId_idx" ON "Correspondence"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Correspondence_tenantId_serialNumber_key" ON "Correspondence"("tenantId", "serialNumber");

-- AddForeignKey
ALTER TABLE "Correspondence" ADD CONSTRAINT "Correspondence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correspondence" ADD CONSTRAINT "Correspondence_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Correspondence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
