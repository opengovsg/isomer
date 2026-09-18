-- CreateEnum
CREATE TYPE "ScheduledAction" AS ENUM ('Publish', 'Unpublish');

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "scheduledAction" "ScheduledAction";
