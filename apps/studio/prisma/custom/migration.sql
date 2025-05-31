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

DROP INDEX "ResourcePermission_userId_siteId_resourceId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ResourcePermission_userId_siteId_resourceId_key" ON "ResourcePermission"("userId", "siteId", "resourceId") NULLS NOT DISTINCT;
