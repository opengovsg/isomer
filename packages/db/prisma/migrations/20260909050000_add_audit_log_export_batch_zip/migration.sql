-- AlterTable
ALTER TABLE "AuditLogExportRequest" DROP COLUMN "batchEmailedAt";

-- CreateTable
CREATE TABLE "AuditLogExportBatch" (
    "batchId" TEXT NOT NULL,
    "zipObjectKey" TEXT,
    "claimedAt" TIMESTAMP(3),
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogExportBatch_pkey" PRIMARY KEY ("batchId")
);
