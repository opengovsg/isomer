---------------------------------

DROP INDEX "ResourcePermission_userId_siteId_resourceId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ResourcePermission_userId_siteId_resourceId_key" ON "ResourcePermission"("userId", "siteId", "resourceId") NULLS NOT DISTINCT;

