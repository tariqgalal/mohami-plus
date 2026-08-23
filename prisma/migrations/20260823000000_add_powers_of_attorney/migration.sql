-- CreateEnum
CREATE TYPE "POAStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PARTIALLY_REVOKED', 'FULLY_REVOKED');

-- CreateTable
CREATE TABLE "PowerOfAttorney" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "startDateHijri" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDateHijri" TEXT NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "POAStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "PowerOfAttorney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PowerOfAttorney_tenantId_idx" ON "PowerOfAttorney"("tenantId");

-- CreateIndex
CREATE INDEX "PowerOfAttorney_tenantId_status_idx" ON "PowerOfAttorney"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PowerOfAttorney_tenantId_endDate_idx" ON "PowerOfAttorney"("tenantId", "endDate");

-- CreateIndex
CREATE INDEX "PowerOfAttorney_clientId_idx" ON "PowerOfAttorney"("clientId");

-- AddForeignKey
ALTER TABLE "PowerOfAttorney" ADD CONSTRAINT "PowerOfAttorney_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PowerOfAttorney" ADD CONSTRAINT "PowerOfAttorney_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

