-- CreateEnum
CREATE TYPE "AuditLogExportReportType" AS ENUM ('Access', 'Activity');

-- CreateEnum
CREATE TYPE "AuditLogExportStatus" AS ENUM ('Pending', 'Processing', 'Done', 'Failed');

-- CreateTable
-- "auditLogDateRange" bounds are SGT calendar dates, half-open [) (Postgres
-- canonicalizes daterange to this form); a full month is e.g.
-- [2026-04-01,2026-05-01). Current-month requests are clamped to today+1 at
-- insert time.
CREATE TABLE "AuditLogExportRequest" (
    "id" BIGSERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "auditLogDateRange" daterange NOT NULL,
    "reportType" "AuditLogExportReportType" NOT NULL,
    "status" "AuditLogExportStatus" NOT NULL DEFAULT 'Pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "objectKey" TEXT,
    -- set when the request reaches Done; a completed row whose "completedAt" >=
    -- the end of its "auditLogDateRange" holds a Complete Artifact eligible for reuse
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogExportRequest_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
-- The export range must be non-empty and bounded on both sides: an unbounded
-- or empty range is never a valid audit log export request.
ALTER TABLE "AuditLogExportRequest"
    ADD CONSTRAINT "AuditLogExportRequest_auditLogDateRange_bounded_check"
    CHECK (
        NOT isempty("auditLogDateRange")
        AND lower("auditLogDateRange") IS NOT NULL
        AND upper("auditLogDateRange") IS NOT NULL
    );

-- CreateIndex
CREATE INDEX "AuditLogExportRequest_status_idx" ON "AuditLogExportRequest"("status");

-- CreateIndex
-- Partial UNIQUE index: prevents duplicate in-flight export requests for the same
-- (site, user, range, reportType) while one is still Pending/Processing, closing the
-- SELECT-then-INSERT race in the service layer. Once a request reaches Done/Failed the
-- row drops out of the index, so the same range can be re-requested later.
-- Dedupe is by range EQUALITY (not overlap); Postgres canonicalizes daterange to
-- half-open [) form, so equality is representation-proof (e.g. [a,b] and [a,b+1)
-- store identically).
-- Prisma cannot express a partial unique index, so this is hand-written SQL and the
-- Prisma schema keeps a plain @@index (expect migrate-dev drift on this index).
-- (Index name kept under Postgres's 63-char identifier limit.)
CREATE UNIQUE INDEX "AuditLogExportRequest_siteId_userId_dateRange_reportType_idx" ON "AuditLogExportRequest"("siteId", "userId", "auditLogDateRange", "reportType") WHERE "status" IN ('Pending', 'Processing');

-- AddForeignKey
ALTER TABLE "AuditLogExportRequest" ADD CONSTRAINT "AuditLogExportRequest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogExportRequest" ADD CONSTRAINT "AuditLogExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
