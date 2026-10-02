---
id: 02-postman-attachment-research
title: Confirm Postman.gov.sg attachment support and limits
label: wayfinder:research
status: closed
assignee: null
blocked_by: []
map: ../MAP.md
---

## Question

`apps/studio/src/lib/mail.ts` sends transactional email via the
Postman.gov.sg API with payload `{recipient, subject, body, cc}` — no
attachment field exists in the current integration, and grepping the repo
for "attachment" turns up nothing related to email.

Confirm, from Postman.gov.sg's own API documentation:

- Does the transactional email API support real file attachments at all?
- If so, what are the size/type limits, and would a multi-site zip
  plausibly fit within them at realistic scale (see ticket 01 for how many
  sites can be in one batch)?
- Is there any prior internal decision (search this repo's ADRs, e.g.
  `docs/adr/0004-emailed-signed-url-delivery-for-audit-exports.md`, and any
  Isomer engineering docs) explaining why links were chosen over
  attachments for audit exports in the first place?

This closes off, with an actual citation rather than an assumption,
whether "deliver as a zip" could mean a literal email attachment. The map's
Notes already record the working assumption (link-based, not an
attachment) settled during grilling — this ticket exists to confirm that
assumption is correct before it's locked into the ADR that ticket 04
produces, not to reopen the question.

## Resolution

Full findings: [`research/02-postman-attachment-research.md`](../research/02-postman-attachment-research.md) (from branch `research/postman-attachment-support`).

**Confirmed: stay link-based, not a literal attachment.** Postman.gov.sg's
API does technically support attachments (up to 10 files, 2MB each, 10MB
cumulative, `413` on overflow), per the official Postman Guide — but two
things rule it out here:

1. Attachments require a **custom "from" sending domain** provisioned with
   Postman; Isomer's audit-export deploy checklist
   (`docs/deploy/audit-log-exports.md`) confirms "no new provider config"
   was added for this feature, and `mail.ts` sends plain JSON, not the
   `multipart/form-data` attachments require.
2. Even if that were set up, **2MB per attachment is the binding limit for
   a single zip**, and the batch scope is explicitly unbounded — "every
   site on the platform" with no cap (`getAdminSiteIds`,
   `site.service.ts:54-76`). No in-repo evidence bounds how large that zip
   could get, so a hard-coded 2MB ceiling with a `413` failure mode (not a
   graceful degrade) is the wrong foundation to build on.

No prior ADR or commit ever evaluated attachments for this feature —
this was an open question, not a previously-rejected option. This
confirms the map's settled assumption; combined with ticket 01's `archiver`
recommendation, it fully unblocks ticket 04.
