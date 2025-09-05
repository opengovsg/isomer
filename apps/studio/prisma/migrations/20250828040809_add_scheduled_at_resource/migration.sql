-- AlterEnum
ALTER TYPE "AuditLogEvent" ADD VALUE 'ResourceSchedule';
ALTER TYPE "AuditLogEvent" ADD VALUE 'CancelResourceSchedule';

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "scheduledAt" TIMESTAMP(3);
