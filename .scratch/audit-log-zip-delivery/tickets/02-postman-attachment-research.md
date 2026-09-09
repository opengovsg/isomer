---
id: 02-postman-attachment-research
title: Confirm Postman.gov.sg attachment support and limits
label: wayfinder:research
status: open
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
