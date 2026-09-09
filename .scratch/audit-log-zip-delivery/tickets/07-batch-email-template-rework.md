---
id: 07-batch-email-template-rework
title: Rework the batch-ready email template for a single zip link
label: wayfinder:grilling
status: open
assignee: null
blocked_by: [05-download-token-flow-for-batch-zip, 06-zip-build-failure-retry-handling]
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
