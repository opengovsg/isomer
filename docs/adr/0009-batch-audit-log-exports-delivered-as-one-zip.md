---
status: accepted
extends: 0006-sealed-download-tokens-for-audit-exports.md
---

# Batch Audit Log Exports are delivered as one zip archive behind one Download Token

A **batch** (all-sites) Audit Log Export email delivers **one zip archive**
containing every successfully-generated site's CSV — named so the source
site is unambiguous — behind **one** sealed Download Token, instead of the
current N per-site download links in one email body. Single-site,
single-report exports are unchanged: they keep their existing one-CSV,
one-link email.

The zip stays link-based, not a literal email attachment: it is assembled
server-side and uploaded to S3 as a single object, delivered the same way
CSVs already are (ADR 0006's sealed Download Token, redeemed at
`apps/studio/src/pages/api/audit-log-exports/download.ts`, minting a
short-lived presigned URL at click time).

## Why not a real email attachment

Postman.gov.sg's transactional email API does support attachments, but two
things rule it out for this feature: attachments require a custom "from"
sending domain that Isomer hasn't provisioned for this mail pipeline (the
current integration sends plain JSON, not the `multipart/form-data`
attachments require), and the binding size limit is 2MB per attachment —
a hard, non-graceful (`413`) ceiling against a batch scope that's
explicitly unbounded in code ("every site on the platform" for an Isomer
Admin, via `getAdminSiteIds`, no cap). A zip-behind-a-link has no such
ceiling.

## Decisions and their reasons

- **Zip assembly extends `maybeSendAuditLogExportBatchEmail` in place**
  (`apps/studio/src/server/modules/audit/auditLogExport.service.ts`),
  rather than a new separate step. That function already holds the
  per-batch advisory lock and the "are all siblings terminal" check this
  needs; a separate step would have to re-derive both.
- **`archiver`** (MIT, streaming) assembles the zip. Its `Archiver`
  instance is itself a `Readable`, so each site's existing
  `createCsvTransform()` output is `.append()`-ed as a named entry and the
  archive's output pipes directly into the same `@aws-sdk/lib-storage`
  `Upload` sink `uploadAuditLogExport` already uses — no stage in the
  pipeline (Postgres cursor → CSV → zip entry → S3 multipart part) ever
  buffers a full file or the full archive in memory. `jszip` was rejected
  for buffering the whole archive before emitting anything, which directly
  conflicts with that never-buffer property; `yazl` is a viable but
  lower-level alternative with no material advantage here.
- **The zip is rebuilt fresh every time a batch completes; no new
  reuse/caching layer.** A `batchId` is minted fresh (`randomUUID()`) for
  every "allSites" ask, so there's no second identical ask that would
  benefit from reusing a previous zip the way ADR 0005's per-site CSV
  reuse benefits repeated single-site asks. Per-site CSV reuse is
  completely unaffected — the zip step just streams whatever CSVs exist
  (freshly generated or ADR-0005-reused) into a new zip object every time.
- **The "already emailed" claim moves from before the slow work to after
  it.** Today `batchEmailedAt` is stamped inside the advisory-lock
  transaction, before links are built or mail is sent. With zip assembly
  now sitting in that gap, the claim must move to *after* the zip is
  built, uploaded, and the email actually sends — otherwise a failed zip
  build would look "already handled" forever and the batch would never
  retry. Concretely: the locked transaction becomes read-only (checks "all
  terminal, not yet emailed"); zip-build, upload, and send happen outside
  it; the claim is written in a short follow-up update only once send
  succeeds. This surfaces a gap for a follow-on ticket to close: batch
  email dispatch today is only triggered as a side effect of a sibling row
  transitioning to terminal, not on a cron cadence of its own — once every
  sibling is already terminal, nothing will naturally re-invoke this on a
  later tick. A dedicated sweep for "batch fully terminal, not yet
  emailed" is needed to make the retry real, not just theoretical.
- **A new `AuditLogExportBatch` table, keyed by `batchId`**, holds
  `zipObjectKey`, `zipSizeInBytes`, and `emailedAt` — not new columns
  repeated across every sibling `AuditLogExportRequest` row. This data is
  inherently per-batch, not per-site-row; redundant N-way writes invite
  partial-write drift, and it gives the Download Token flow one
  unambiguous row to key off instead of picking an arbitrary sibling and
  trusting it.
- **S3 key**: `audit-log-exports/batch/{batchId}/{reportType}-{rangeSlug}.zip`.
  `batchId` alone already guarantees uniqueness; `reportType`/`rangeSlug`
  are included purely for human-readability in the S3 console, mirroring
  the existing per-CSV key's spirit.
- **Failed sites stay outside the zip.** The zip contains only
  successfully-generated CSVs; failed site names continue to be listed as
  plain text in the email body, unchanged from today's batch email.
- **`sizeInBytes`** is read back with a `HeadObject` once the upload
  completes, rather than tracked manually through the `archiver` stream.

## Consequences

- `uploadAuditLogExport` (`apps/studio/src/lib/s3.ts`) needs a
  `contentType` parameter (defaulting to `text/csv`) since it currently
  hardcodes the CSV content type; the zip upload passes
  `application/zip`.
- The Download Token's payload and the download route's re-read logic
  need a batch-shaped path alongside the existing single-request path
  (tracked as a follow-on decision, not solved by this ADR).
- This stacks on top of the not-yet-merged batching feature (`batchId`,
  `batchEmailedAt`, `maybeSendAuditLogExportBatchEmail` — currently only
  on `fix/batch-audit-logs`, not `main`); it cannot be implemented or
  reviewed independently of that branch landing first, or without basing
  this work on top of it.
