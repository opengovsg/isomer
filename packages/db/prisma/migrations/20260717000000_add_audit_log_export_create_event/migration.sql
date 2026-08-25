-- AlterEnum
-- Every audit log export ask is recorded as an AuditLogExportCreate event
-- (ADR docs/adr/0005): agencies can see who exports their logs in the
-- Activity report, including asks that were idempotent-accepted or fulfilled
-- by reusing a Complete Artifact.
ALTER TYPE "AuditLogEvent" ADD VALUE 'AuditLogExportCreate';
