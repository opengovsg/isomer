---------------------------------
-- PermissionDelete lookups by site and actor (admin vs system user), e.g.
-- filtering metadata->>'reason' = 'inactivity' for inactive-user removals.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_siteId_eventType_userId_idx" ON "AuditLog"("siteId", "eventType", "userId");
