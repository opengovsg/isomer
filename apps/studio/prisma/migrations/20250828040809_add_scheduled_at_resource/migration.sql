-- AlterEnum
ALTER TYPE "AuditLogEvent" ADD VALUE 'ResourceSchedule';

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "scheduledAt" TIMESTAMP(3);
