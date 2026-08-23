-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('CLIENT', 'LAWYER', 'PHONE', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'IN_STUDY', 'INITIAL_APPROVAL', 'FINAL_APPROVAL', 'REJECTED');

-- CreateTable
CREATE TABLE "ClientServiceRequest" (
    "id" TEXT NOT NULL,
    "source" "RequestSource" NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestSubType" TEXT,
    "description" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "applicantEmail" TEXT,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "dateHijri" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "timeSpent" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ClientServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientServiceRequest_tenantId_idx" ON "ClientServiceRequest"("tenantId");

-- CreateIndex
CREATE INDEX "ClientServiceRequest_tenantId_status_idx" ON "ClientServiceRequest"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "ClientServiceRequest" ADD CONSTRAINT "ClientServiceRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
