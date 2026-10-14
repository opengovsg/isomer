---
status: superseded by 0006-sealed-download-tokens-for-audit-exports.md
---

# Audit Log Exports are delivered as long-lived signed S3 URLs in email

A completed Audit Log Export is delivered by emailing the requesting Site Admin a **signed S3 GET URL valid for 3 days**, after which the download link expires (the presigned URL is no longer usable). The link is a standalone bearer credential: anyone who receives the email can download the CSV — which contains sensitive data (user emails, roles, IP addresses, login/logout history) — with no re-authentication. We accepted this for simplicity over building an authenticated in-Studio download flow.

## Considered options

- **Link to an authenticated Studio route that mints a short-lived signed URL on click** — recipient must be a logged-in Admin of the site; access is re-checked at download time, so no bearer credential leaves Studio. Rejected for now in favour of a simpler email-only flow, despite being the stronger choice for sensitive data.
- **Studio "Exports" page with history + auth-gated re-download** — most robust, but more UI than this iteration warrants.

## Consequences

This is a deliberate convenience-over-security trade-off and a reviewer will (rightly) question it. Mitigations: the presigned download URL expires after 3 days, bounding how long the emailed bearer credential works; exports are Site-Admin-only; and the default 5-minute signed-URL expiry in `src/lib/s3.ts` must be raised specifically for this path. Note that URL expiry does not delete the underlying S3 object — a separate object-lifecycle/deletion policy would be needed to bound data-at-rest exposure, which is not yet implemented. If the threat model tightens, switch to the authenticated-route option above without changing the rest of the workflow.
