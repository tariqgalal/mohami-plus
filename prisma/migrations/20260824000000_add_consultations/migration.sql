-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('LEGAL_CONSULTATION', 'REGULATIONS_REVIEW', 'CONTRACT_REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ConsultationType" NOT NULL DEFAULT 'LEGAL_CONSULTATION',
    "clientId" TEXT,
    "clientName" TEXT,
    "assignedTo" JSONB,
    "dateHijri" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'ACTIVE',
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consultation_tenantId_idx" ON "Consultation"("tenantId");

-- CreateIndex
CREATE INDEX "Consultation_tenantId_status_idx" ON "Consultation"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_tenantId_number_key" ON "Consultation"("tenantId", "number");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
