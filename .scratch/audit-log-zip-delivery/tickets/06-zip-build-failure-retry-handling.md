---
id: 06-zip-build-failure-retry-handling
title: Design zip-build failure and retry handling in the cron job
label: wayfinder:grilling
status: open
assignee: null
blocked_by: [04-zip-assembly-storage-design]
map: ../MAP.md
---

## Question

The map's Notes already settle the high-level answer: a zip-build failure
(e.g. an S3 read error mid-stream while assembling the archive) retries on
the next cron tick, and per-site rows already `Done` are left untouched —
zip assembly is a separate, idempotent, retry-safe step layered on top of
`maybeSendAuditLogExportBatchEmail`, matching the job's existing
retry-safe design (`apps/studio/src/server/cron/jobs/auditLogExportJob.ts`,
`processPendingAuditLogExports`).

This ticket works out the mechanics, once ticket 04 has fixed where/how
the zip is assembled:

- What state (if any) needs to be persisted to know "the zip for this
  batch hasn't been built yet" vs. "built, email not yet sent" vs. "email
  sent" — a new column on some row, or is this derivable from what
  already exists (e.g. absence of the zip object in S3, or absence of a
  `batchEmailedAt` timestamp)?
- How does the cron sweep avoid re-triggering zip assembly (and wasted S3
  reads) on every tick for a batch that's still legitimately in-progress
  (not every sibling site row terminal yet) vs. one that's stuck retrying
  a failed zip build?
- Is there a retry cap / backoff, or does it retry indefinitely until it
  succeeds (same posture as the rest of this job today — confirm by
  reading how `processPendingAuditLogExports` currently handles stale/
  failed rows)?
- Does a zip-build failure need its own logging/alerting distinct from
  per-site CSV generation failures, so a stuck batch is visible to an
  operator?
