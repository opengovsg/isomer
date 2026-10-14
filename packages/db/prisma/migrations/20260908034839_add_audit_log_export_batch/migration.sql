-- CreateTable
-- Shared per-batch state for an "allSites" ask's single combined email,
-- normalised out of AuditLogExportRequest so it is not duplicated across every
-- sibling row.
CREATE TABLE "AuditLogExportBatch" (
    "id" TEXT NOT NULL,
    "emailedAt" TIMESTAMP(3),
    "emailAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogExportBatch_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AuditLogExportRequest" ADD COLUMN     "batchId" TEXT;

-- CreateIndex
-- NOTE: We deliberately do NOT (re)create a plain index on
-- ("siteId", "userId", "auditLogDateRange", "reportType") here. The earlier
-- audit-export migration (20260630031102) already covers those columns with a
-- PARTIAL UNIQUE index (`WHERE status IN ('Pending', 'Processing')`), which is
-- what serves the in-flight dedupe SELECT. The Prisma schema keeps a plain
-- `@@index` on the same columns as the DSL stand-in for that partial index, so
-- `prisma migrate dev` reports drift and wants to add the full index — that
-- drift is expected and must NOT be captured into a migration, or we ship a
-- redundant full-table index on top of the partial one.
CREATE INDEX "AuditLogExportRequest_batchId_idx" ON "AuditLogExportRequest"("batchId");

-- AddForeignKey
ALTER TABLE "AuditLogExportRequest" ADD CONSTRAINT "AuditLogExportRequest_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "AuditLogExportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
