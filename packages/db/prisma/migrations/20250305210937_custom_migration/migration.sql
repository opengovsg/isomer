---------------------------------
-- This migration fixes uniqueness constraints for User and ResourcePermission.
-- Reference: https://github.com/opengovsg/isomer/pull/1155

DROP INDEX "ResourcePermission_userId_siteId_resourceId_deletedAt_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ResourcePermission_userId_siteId_resourceId_deletedAt_key" ON "ResourcePermission"("userId", "siteId", "resourceId", "deletedAt") NULLS NOT DISTINCT;

DROP INDEX "User_email_deletedAt_key";

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_deletedAt_key" ON "User"("email", "deletedAt") NULLS NOT DISTINCT;

---------------------------------;

