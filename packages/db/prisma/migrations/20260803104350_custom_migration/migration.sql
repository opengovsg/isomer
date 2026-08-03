---------------------------------


---------------------------------
-- Adds an index on Version(resourceId, versionNum DESC) to support finding
-- the latest version for a resource (WHERE resourceId = $1 ORDER BY
-- versionNum DESC LIMIT 1), a query that runs on every publish, unpublish,
-- and archive-draft for every resource on the platform. Version is a large,
-- append-only, platform-shared table, so this index is created
-- CONCURRENTLY to avoid taking a write lock on the table.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Version_resourceId_versionNum_idx" ON "Version"("resourceId", "versionNum" DESC);

