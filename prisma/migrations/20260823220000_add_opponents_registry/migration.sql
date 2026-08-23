-- CreateEnum
CREATE TYPE "OpponentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "OpponentRecord" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "idNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "caseIds" JSONB,
    "status" "OpponentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "OpponentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpponentRecord_tenantId_idx" ON "OpponentRecord"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "OpponentRecord_tenantId_number_key" ON "OpponentRecord"("tenantId", "number");

-- AddForeignKey
ALTER TABLE "OpponentRecord" ADD CONSTRAINT "OpponentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
