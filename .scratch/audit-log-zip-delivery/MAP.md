---
label: wayfinder:map
status: open
tracker: local-markdown
---

# Audit log batch export delivered as a single zip

## Destination

A locked technical design — recorded as resolved tickets plus a new ADR — for
delivering **batch** (all-sites) audit-log-export emails as a single zip
archive per batch, with each CSV inside the zip named so the site it came
from is unambiguous (siteName + siteId). Scope is the batch email only; the
single-site/single-report ready email (`auditLogExportReadyTemplate`) is
unchanged.

**Status: reached, then extended.** All 7 tickets are closed and ADR 0009
records the full design. The map's original posture was design-only (no
execution override in these Notes) — implementation was meant to be a
separate follow-up pass — but partway through resolving ticket 04 the user
explicitly asked to continue straight into code in the same session.
Tickets 03/05/06/07 were consequently resolved as part of implementing,
not one-at-a-time grilling sessions; each still records its own resolution
below for the same reason a grilled ticket would. The implementation
itself is [PR #3367](https://github.com/opengovsg/isomer/pull/3367)
(`feat/audit-log-zip-delivery`, stacked on `fix/batch-audit-logs`).

Reaching the end looks like: every ticket below closed, a new ADR written
under `docs/adr/` recording the delivery-mechanism decision, and
`CONTEXT.md` updated with whatever new vocabulary the tickets settle on —
all done. What's left is ordinary code review of PR #3367, not further
wayfinding.

## Notes

- **Stacking dependency (confirmed while resolving ticket 04)**: this map's
  destination code (`maybeSendAuditLogExportBatchEmail`, `batchId`,
  `batchEmailedAt`) exists only on `origin/fix/batch-audit-logs` (commit
  `c573c2208`), not on `main`. This map's own branch was cut fresh from
  `main` (a wayfinder charting artifact, docs-only), but any
  implementation must branch from `fix/batch-audit-logs` instead.
- Touches: `apps/studio/src/server/modules/audit/auditLogExport.service.ts`,
  `apps/studio/src/server/modules/audit/auditLogExport.query.ts`,
  `apps/studio/src/features/mail/templates/templates.ts`,
  `apps/studio/src/features/mail/templates/types.ts`,
  `apps/studio/src/lib/mail.ts`,
  `apps/studio/src/pages/api/audit-log-exports/download.ts`.
- Prior art: `docs/adr/0004-emailed-signed-url-delivery-for-audit-exports.md`
  (superseded), `docs/adr/0005-complete-artifact-reuse-for-audit-exports.md`
  (accepted, per-site CSV reuse — **unaffected** by this map), `docs/adr/0006-sealed-download-tokens-for-audit-exports.md`
  (accepted — this map's ADR extends it for the batch case).
- Glossary in root `CONTEXT.md` under "Audit and access logging" — consult
  before naming anything new; "batch"/all-sites export currently has no
  glossary entry (added by commit c573c2208, undocumented).
- **Settled going in** (from grilling before tickets were cut):
  - Delivery stays link-based, not a real email attachment: the zip is one
    S3 object, emailed as a click-to-download link via the same sealed
    Download Token pattern (ADR 0006) already used for CSVs — not a
    literal Postman.gov.sg email attachment.
  - The zip is **rebuilt fresh every time a batch completes** — no new
    reuse/caching layer for the zip itself. Per-site CSV reuse (ADR 0005)
    is untouched and keeps working exactly as it does today underneath.
  - A zip-build failure **retries on the next cron tick**; per-site rows
    already `Done` are left alone (zip assembly is a separate, idempotent,
    retry-safe step layered on top of `maybeSendAuditLogExportBatchEmail`).
  - Filenames inside the zip must make the source site unambiguous to a
    human (siteName), and per the original ask also carry siteId.
- Sessions working a ticket here should consult the `grilling` and
  `domain-modeling` skills; the deeper design tickets are expected to
  produce a new ADR and a CONTEXT.md glossary addition.

## Decisions so far

- [Select a streaming Node zip library for batch export assembly](tickets/01-zip-library-research.md): use `archiver` — streams directly into the existing S3 multipart-upload sink, no full-archive buffering.
- [Confirm Postman.gov.sg attachment support and limits](tickets/02-postman-attachment-research.md): attachments exist but are capped at 2MB/file and need a sending domain Isomer hasn't provisioned — confirmed, stay link-based (zip in S3 behind the existing download-token link).
- [Design zip assembly, storage, and its interaction with existing CSV reuse](tickets/04-zip-assembly-storage-design.md): recorded as [ADR 0009](../../docs/adr/0009-batch-audit-log-exports-delivered-as-one-zip.md) — extends `maybeSendAuditLogExportBatchEmail` in place with `archiver`, moves the `batchEmailedAt` claim to after send succeeds, new `AuditLogExportBatch` table for zip metadata. Confirmed this whole map stacks on `fix/batch-audit-logs`, not `main`.
- [Decide the zip entry filename convention](tickets/03-zip-entry-filename-convention.md): `{sanitizedSiteName}-{siteId}-{reportKind}-{rangeSlug}.csv`; siteId always appended so sanitized collisions can't collide.
- [Extend the sealed Download Token flow to resolve a shared batch zip](tickets/05-download-token-flow-for-batch-zip.md): new `audit-log-export-batch` token purpose keyed on `batchId`; window anchors to `AuditLogExportBatch.emailedAt`.
- [Design zip-build failure and retry handling in the cron job](tickets/06-zip-build-failure-retry-handling.md): `AuditLogExportBatch.claimedAt` as a 15-minute lease, plus a new `processPendingAuditLogExportBatchEmails` sweep — needed because a fully-terminal batch no longer self-triggers a retry.
- [Rework the batch-ready email template for a single zip link](tickets/07-batch-email-template-rework.md): `zipLink` (optional — undefined when every site fails) + `includedSiteNames` replace the old per-site `links` array.

## Not yet specified

- Rollout/feature-flag strategy for switching the batch email over to the
  new zip format — **still genuinely open**: PR #3367 ships the new format
  as the only behavior (no flag), which is a real gap this map flagged but
  never explicitly closed. Worth a decision before merging, not fog
  anymore now that the design is locked — a reviewer of PR #3367 should
  weigh in rather than this map reopening it.

## Out of scope

- Changing the single-site/single-report ready email
  (`auditLogExportReadyTemplate`) to also zip its one CSV — explicitly
  ruled out when naming the destination; that path keeps its plain
  download link.
- The pre-existing data-at-rest lifecycle gap noted in ADR 0004/0006 (no
  S3 object deletion policy after link expiry) — a known, already-deferred
  gap that predates this map and isn't reopened by it.
