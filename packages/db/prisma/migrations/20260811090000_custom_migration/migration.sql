---------------------------------
-- Non-locking index to look up a resource's latest Version by resourceId,
-- ordered by versionNum. Version can grow large, so this is created
-- CONCURRENTLY instead of via a normal Prisma migration.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Version_resourceId_versionNum_idx" ON "Version"("resourceId", "versionNum");

---------------------------------
