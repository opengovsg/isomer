---
id: 07-batch-email-template-rework
title: Rework the batch-ready email template for a single zip link
label: wayfinder:grilling
status: closed
assignee: claude
blocked_by: []  # was [05, 06], both closed
map: ../MAP.md
---

## Question

`auditLogExportBatchReadyTemplate`
(`apps/studio/src/features/mail/templates/templates.ts:337-369`) currently
renders one `<li><b>{siteName}</b>: <a>...</a></li>` per successful site,
plus a failed-sites list, backed by
`AuditLogExportBatchReadyEmailTemplateData`
(`apps/studio/src/features/mail/templates/types.ts:87-95`):
`{month, reportLabel, links: {siteName, url, sizeInBytes}[], failedSiteNames}`.

Once tickets 05 (token/link shape) and 06 (failure/retry semantics) are
settled, rework:

- **Template data shape**: replace the per-site `links` array with
  whatever ticket 05 produces (a single zip download URL) plus enough
  data to still list which sites are included — the recipient can't
  preview zip contents before downloading, so the email body should still
  name every site whose CSV made it in, even though they now share one
  link.
- **Copy**: the email needs new wording — no longer "here are your N
  links", but "here is one zip containing N sites' reports"; failed sites
  keep their own listing (unchanged from today).
- **Size display**: swap per-site `sizeInBytes` for the zip's total size
  (from ticket 04).
- Whether a **prototype** pass (the `prototype` skill) is worth running
  first to sanity-check the new copy/layout before locking the type
  change — recommended given this is user-facing copy, not just plumbing.

## Resolution

Resolved directly during implementation (PR [feat: deliver batch audit log
exports as a single zip file](https://github.com/opengovsg/isomer/pull/3367)),
once the user asked to move from design straight to code — the recommended
prototype pass on copy was skipped for that reason, not overruled; the
copy below is a reasonable first cut, not a validated one.

- `AuditLogExportBatchReadyEmailTemplateData.links` replaced with
  `zipLink?: {url, sizeInBytes}` (optional — undefined when every site
  failed, see below) plus `includedSiteNames: string[]`, naming every site
  whose CSV made it into the zip since the recipient can't preview the
  archive before downloading.
- Copy: "You requested ... logs for all your sites for {month}, bundled
  into a single zip file", one download line, then an "This zip includes
  ... logs for:" list, then the existing failed-sites section unchanged.
- Size: `zipLink.sizeInBytes` is the zip's total size (read via
  `HeadObject` after upload, per ADR 0009), not a per-site figure.
- Edge case this ticket didn't originally flag: a batch where **every**
  site failed has nothing to zip at all — `zipLink` is `undefined` in that
  case and the template renders no download line, just the failure list.
