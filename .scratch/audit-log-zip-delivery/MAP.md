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
unchanged. This map produces the design; implementation is a separate
follow-up pass (see [Plan, don't do](../../.claude/skills/wayfinder/SKILL.md)
— no execution override for this map).

Reaching the end looks like: every ticket below closed, a new ADR written
under `docs/adr/` recording the delivery-mechanism decision, and
`CONTEXT.md` updated with whatever new vocabulary (e.g. "Export Batch" /
zip artifact naming) the tickets settle on.

## Notes

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

_(none yet — no tickets closed)_

## Not yet specified

- Rollout/feature-flag strategy for switching the batch email over to the
  new zip format (fog until the design tickets below settle what "the new
  format" actually is).

## Out of scope

- Changing the single-site/single-report ready email
  (`auditLogExportReadyTemplate`) to also zip its one CSV — explicitly
  ruled out when naming the destination; that path keeps its plain
  download link.
- The pre-existing data-at-rest lifecycle gap noted in ADR 0004/0006 (no
  S3 object deletion policy after link expiry) — a known, already-deferred
  gap that predates this map and isn't reopened by it.
