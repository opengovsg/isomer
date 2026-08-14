-- CreateEnum
CREATE TYPE "ScheduledAction" AS ENUM ('Publish', 'Unpublish');

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "scheduledAction" "ScheduledAction";

-- Backfill: every existing scheduledAt was set by the old publish-only
-- scheduling flow, so it always meant "scheduled to publish."
UPDATE "Resource" SET "scheduledAction" = 'Publish' WHERE "scheduledAt" IS NOT NULL;
