---
id: 04-zip-assembly-storage-design
title: Design zip assembly, storage, and its interaction with existing CSV reuse
label: wayfinder:grilling
status: closed
assignee: claude
blocked_by: []  # was [01-zip-library-research, 02-postman-attachment-research], both closed — see their Resolutions
map: ../MAP.md
---

## Question

Design where and how the batch zip gets built and stored, using the
library ticket 01 selects and the confirmed delivery mechanism from
ticket 02. This ticket is expected to produce a new ADR (supersedes/extends
`docs/adr/0006-sealed-download-tokens-for-audit-exports.md` for the batch
case) — see the `domain-modeling` skill's ADR criteria; this change is
hard to reverse, surprising without context, and the result of a real
trade-off, so it qualifies.

Cover:

- **Where in the pipeline**: extend `maybeSendAuditLogExportBatchEmail`
  (`apps/studio/src/server/modules/audit/auditLogExport.service.ts:407`) to
  build the zip once every sibling site's row is terminal, or introduce a
  separate step? The map's Notes already settle that this must be
  retry-safe and idempotent (see ticket 06 for the failure-handling
  detail — don't re-decide that here, just make sure the assembly point
  you choose is compatible with retrying).
- **S3 key pattern** for the zip object, following the existing
  `audit-log-exports/{siteId}/{requestId}/{type}-{rangeSlug}.csv`
  convention's spirit — likely keyed by `batchId` and range rather than
  siteId/requestId since it spans multiple sites.
- **Interaction with ADR 0005 reuse**: confirm (per the map's settled
  answer) that per-site CSV reuse keeps working completely unchanged
  underneath, and that the zip itself introduces no new
  reuse/dedup/caching mechanism — it just streams whatever CSVs exist
  (fresh or reused) into a new zip object every time.
- **Failed sites**: the zip contains only successfully-generated CSVs;
  failed site names continue to be listed as plain text in the email body
  (as `auditLogExportBatchReadyTemplate` already does today) rather than,
  say, a manifest file inside the zip.
- What the zip's total `sizeInBytes` is computed from, for use in the
  email template (ticket 07).

## Downstream

Resolving this unblocks ticket 05 (Download Token flow) and ticket 06
(failure/retry handling), both of which need the object-key and
assembly-point decisions made here.

## Resolution

Full design recorded as [ADR 0009](../../../docs/adr/0009-batch-audit-log-exports-delivered-as-one-zip.md).

- Zip assembly extends `maybeSendAuditLogExportBatchEmail` in place
  (same advisory-lock transaction), using `archiver` (ticket 01) piped
  into the existing S3 `Upload` sink.
- The "already emailed" claim (`batchEmailedAt`) moves from before the
  slow work to after it succeeds — the locked transaction becomes
  read-only, zip-build/upload/send happen outside it, and the claim is
  written in a follow-up update only once send succeeds. **This exposes a
  real gap for ticket 06**: batch email dispatch is only triggered as a
  side effect of a sibling row going terminal, not on its own cron
  cadence — once every sibling is terminal, nothing will naturally retry
  a failed attempt on "the next tick" without a dedicated sweep. Ticket 06
  must add that sweep, not just assume reprocessing will happen.
- New `AuditLogExportBatch` table (keyed by `batchId`: `zipObjectKey`,
  `zipSizeInBytes`, `emailedAt`) instead of redundant columns on every
  sibling row.
- S3 key: `audit-log-exports/batch/{batchId}/{reportType}-{rangeSlug}.zip`.
- `sizeInBytes` read via `HeadObject` post-upload.
- `uploadAuditLogExport` (`apps/studio/src/lib/s3.ts`) needs a
  `contentType` param (default `text/csv`) to also accept
  `application/zip`.
- Confirmed stacking dependency: this and everything downstream builds on
  the not-yet-merged batching feature (`batchId`/`batchEmailedAt`/
  `maybeSendAuditLogExportBatchEmail`), which exists only on
  `fix/batch-audit-logs`, not `main`. Implementation must branch from
  there.
