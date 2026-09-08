-- AlterTable
ALTER TABLE "AuditLogExportRequest" ADD COLUMN     "batchEmailedAt" TIMESTAMP(3),
ADD COLUMN     "batchId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLogExportRequest_siteId_userId_auditLogDateRange_repor_idx" ON "AuditLogExportRequest"("siteId", "userId", "auditLogDateRange", "reportType");

-- CreateIndex
CREATE INDEX "AuditLogExportRequest_batchId_idx" ON "AuditLogExportRequest"("batchId");
