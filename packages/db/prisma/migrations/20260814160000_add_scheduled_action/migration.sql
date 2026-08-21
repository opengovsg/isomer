-- CreateEnum
CREATE TYPE "ScheduledAction" AS ENUM ('Publish', 'Unpublish');

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "scheduledAction" "ScheduledAction";

-- Backfill: every existing scheduledAt was set by the old publish-only
-- scheduling flow, so it always meant "scheduled to publish." The
-- scheduledAction IS NULL guard is defense-in-depth — it's redundant on a
-- normal one-time apply (the column has no other value yet), but keeps this
-- statement safe if it's ever copied and re-run standalone against a live
-- database that already has real Unpublish schedules.
UPDATE "Resource" SET "scheduledAction" = 'Publish' WHERE "scheduledAt" IS NOT NULL AND "scheduledAction" IS NULL;
