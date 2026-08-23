-- CreateEnum
CREATE TYPE "BorrowingStatus" AS ENUM ('PENDING', 'DELIVERED', 'RETURNED', 'REJECTED');

-- CreateTable
CREATE TABLE "DocumentBorrowing" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "documentSource" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "description" TEXT,
    "borrowDate" TIMESTAMP(3) NOT NULL,
    "borrowDateHijri" TEXT,
    "returnDate" TIMESTAMP(3),
    "returnDateHijri" TEXT,
    "status" "BorrowingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "DocumentBorrowing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentBorrowing_tenantId_idx" ON "DocumentBorrowing"("tenantId");

-- CreateIndex
CREATE INDEX "DocumentBorrowing_tenantId_employeeId_idx" ON "DocumentBorrowing"("tenantId", "employeeId");

-- AddForeignKey
ALTER TABLE "DocumentBorrowing" ADD CONSTRAINT "DocumentBorrowing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
