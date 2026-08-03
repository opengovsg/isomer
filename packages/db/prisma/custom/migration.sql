-- Override Prisma's unique index with unique NOT DISTINCT index
DROP INDEX IF EXISTS "Resource_siteId_parentId_permalink_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Resource_siteId_parentId_permalink_key" ON "Resource"("siteId", "parentId", "permalink") NULLS NOT DISTINCT;


---------------------------------
-- This migration fixes uniqueness constraints for User and ResourcePermission.
-- Reference: https://github.com/opengovsg/isomer/pull/1155

DROP INDEX "ResourcePermission_userId_siteId_resourceId_deletedAt_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ResourcePermission_userId_siteId_resourceId_deletedAt_key" ON "ResourcePermission"("userId", "siteId", "resourceId", "deletedAt") NULLS NOT DISTINCT;

DROP INDEX "User_email_deletedAt_key";

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_deletedAt_key" ON "User"("email", "deletedAt") NULLS NOT DISTINCT;

---------------------------------


---------------------------------
-- Adds an index on Version(resourceId, versionNum DESC) to support finding
-- the latest version for a resource (WHERE resourceId = $1 ORDER BY
-- versionNum DESC LIMIT 1), a query that runs on every publish, unpublish,
-- and archive-draft for every resource on the platform. Version is a large,
-- append-only, platform-shared table, so this index is created
-- CONCURRENTLY to avoid taking a write lock on the table.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Version_resourceId_versionNum_idx" ON "Version"("resourceId", "versionNum" DESC);

---------------------------------
