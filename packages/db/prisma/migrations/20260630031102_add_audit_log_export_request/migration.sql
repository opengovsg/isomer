-- CreateEnum
CREATE TYPE "AuditLogExportReportType" AS ENUM ('Access', 'Activity', 'Both');

-- CreateEnum
CREATE TYPE "AuditLogExportStatus" AS ENUM ('Pending', 'Processing', 'Done', 'Failed');

-- CreateTable
CREATE TABLE "AuditLogExportRequest" (
    "id" BIGSERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "reportType" "AuditLogExportReportType" NOT NULL,
    "status" "AuditLogExportStatus" NOT NULL DEFAULT 'Pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "objectKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLogExportRequest_status_idx" ON "AuditLogExportRequest"("status");

-- CreateIndex
CREATE INDEX "AuditLogExportRequest_siteId_userId_month_reportType_idx" ON "AuditLogExportRequest"("siteId", "userId", "month", "reportType");

-- AddForeignKey
ALTER TABLE "AuditLogExportRequest" ADD CONSTRAINT "AuditLogExportRequest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogExportRequest" ADD CONSTRAINT "AuditLogExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
