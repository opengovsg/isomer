---
id: 06-zip-build-failure-retry-handling
title: Design zip-build failure and retry handling in the cron job
label: wayfinder:grilling
status: closed
assignee: claude
blocked_by: []  # was [04-zip-assembly-storage-design], closed
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

## Resolution

Resolved directly during implementation (PR [feat: deliver batch audit log
exports as a single zip file](https://github.com/opengovsg/isomer/pull/3367)).
This ticket's real substance turned out bigger than "mechanics": ticket 04's
own resolution had already surfaced that moving the "already emailed" claim
to after the slow work (S3 + email) makes `maybeSendAuditLogExportBatchEmail`
no longer self-triggering once a batch is fully terminal — a genuinely new
retry mechanism was needed, not just a state-shape decision.

- **State**: `AuditLogExportBatch.claimedAt` — a lease (mirrors
  `PROCESSING_LEASE_MS`'s role for individual rows), stamped the moment an
  attempt starts, distinct from `emailedAt` (stamped only on full success).
  "Not built yet" = no row; "claimed, in flight or dead" = `claimedAt` set,
  `emailedAt` null; "done" = `emailedAt` set.
- **Avoiding wasted re-triggers**: a new `processPendingAuditLogExportBatchEmails`
  sweep (wired into the existing cron job alongside `processPendingAuditLogExports`)
  finds batches that are fully terminal AND not yet emailed, skipping any
  batch still in-progress (a sibling row not yet terminal) via a cheap
  distinct-batchId query. `maybeSendAuditLogExportBatchEmail`'s own claim
  check (fresh `claimedAt` → back off) prevents this sweep from duplicating
  a still-running attempt.
- **Retry cap**: none — retries indefinitely until success, matching this
  job's existing posture (confirmed against `processAuditLogExportRequest`'s
  own MAX_ATTEMPTS-free stale-reclaim pattern for the row-level lease).
  `BATCH_EMAIL_LEASE_MS` reuses the same 15-minute value as
  `PROCESSING_LEASE_MS`.
- **Alerting**: no new alerting infra — a retry attempt logs at `error`
  level with the `batchId`, using the existing logger, consistent with how
  per-site failures are already surfaced.
