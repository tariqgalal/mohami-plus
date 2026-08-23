-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "registryNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "receiveDate" TIMESTAMP(3),
    "receiveDateHijri" TEXT,
    "sendDate" TIMESTAMP(3),
    "sendDateHijri" TEXT,
    "senderName" TEXT,
    "recipientName" TEXT,
    "department" TEXT,
    "notes" TEXT,
    "attachments" JSONB,
    "status" "TransactionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_tenantId_idx" ON "Transaction"("tenantId");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_direction_idx" ON "Transaction"("tenantId", "direction");

-- CreateTable
CREATE TABLE "EmployeeLeave" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "startDateHijri" TEXT NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "endDateHijri" TEXT NOT NULL,
    "daysCount" INTEGER NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "EmployeeLeave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeLeave_tenantId_idx" ON "EmployeeLeave"("tenantId");

-- CreateIndex
CREATE INDEX "EmployeeLeave_tenantId_employeeId_idx" ON "EmployeeLeave"("tenantId", "employeeId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeave" ADD CONSTRAINT "EmployeeLeave_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
