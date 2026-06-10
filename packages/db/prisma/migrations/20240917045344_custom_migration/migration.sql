-- Override Prisma's unique index with unique NOT DISTINCT index
DROP INDEX IF EXISTS "Resource_siteId_parentId_permalink_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Resource_siteId_parentId_permalink_key" ON "Resource"("siteId", "parentId", "permalink") NULLS NOT DISTINCT;
