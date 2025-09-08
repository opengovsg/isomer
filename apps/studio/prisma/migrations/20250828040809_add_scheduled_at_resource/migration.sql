-- AlterEnum
ALTER TYPE "AuditLogEvent" ADD VALUE 'SchedulePublish';
ALTER TYPE "AuditLogEvent" ADD VALUE 'CancelSchedulePublish';

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "scheduledAt" TIMESTAMP(3);
