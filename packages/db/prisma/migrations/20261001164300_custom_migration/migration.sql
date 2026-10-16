---------------------------------
-- Partial index for site.listExpired. The EXISTS matches inactivity
-- PermissionDelete rows by siteId and the deleted permission id
-- (delta.before.id). AuditLog is append-only, so this is created
-- CONCURRENTLY. Prisma's schema DSL cannot express a partial expression index.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_inactivity_permission_delete_idx"
ON "AuditLog" (
  "siteId",
  ("delta" -> 'before' ->> 'id')
)
WHERE "eventType" = 'PermissionDelete'
  AND "metadata"->>'reason' = 'inactivity';

---------------------------------
