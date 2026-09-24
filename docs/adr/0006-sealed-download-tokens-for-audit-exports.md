---
status: accepted
supersedes: 0004-emailed-signed-url-delivery-for-audit-exports.md
---

# Audit Log Exports are delivered via sealed Download Tokens redeemed at an unauthenticated Studio endpoint

A completed Audit Log Export email links to a Studio endpoint carrying a **sealed Download Token** — an iron-session `sealData` blob (AES-256-CBC + HMAC-SHA256) containing only `{ purpose: "audit-log-export", requestId }`. On click, Studio unseals the token, re-reads the request row, and — only if the row is `Done` and within its **Download Window** (`completedAt` + `AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS`) — mints a ~5-minute presigned S3 URL and 302-redirects to it. All failure modes (forged/tampered/expired token, unknown row, not `Done`, window elapsed) return one indistinguishable "link expired" response.

## Why ADR 0004 is superseded

ADR 0004 emailed a 3-day presigned S3 URL directly. SigV4 presigned URLs are additionally capped by the **lifetime of the signing credentials**: the export worker runs on ECS whose task-role session credentials last ~1 hour, so the emailed "3-day" link silently died within the hour — dead on arrival for any recipient reading email later that day. Minting the presigned URL at *click* time with a short expiry (the existing 5-minute default in `src/lib/s3.ts`) makes the credential-lifetime cap irrelevant.

## Decisions and their reasons

- **Capability URL, not an authenticated route.** The recipient does not log in; possession of the emailed link suffices for the Download Window. This deliberately preserves ADR 0004's no-login UX. The authenticated-route option (re-check Site Admin permission at click time) remains the stronger choice for this data and is the designated escape hatch if the threat model tightens.
- **Token carries only the request id; the row is the source of truth.** Status, `objectKey`, and the window anchor are re-read from `AuditLogExportRequest` at click time. This keeps the token revocable (flip the row or delete the object and every outstanding link dies) and avoids duplicating truth into a credential.
- **Window anchors to the request's `completedAt`, not the CSV object's creation.** Under Complete-Artifact reuse (ADR 0005) a fresh request may be fulfilled by an older CSV; anchoring to object creation would email links already expired. Each request row gets its own window.
- **Sealed with the existing session password map** (`SESSION_SECRET`, versioned) rather than a dedicated secret — no new secret to provision, and key rotation via the versioned map keeps in-flight links alive. Cross-purpose confusion with session cookies is prevented by the `purpose` discriminator plus strict payload-shape validation on unseal; a full rotation that drops old keys kills outstanding links, which is acceptable (and desirable during leak response) given the 3-day window.
- **Plain Next.js API route, not tRPC.** Email clicks are bare GETs with no tRPC envelope; `webhooks.ts` is precedent for non-tRPC routes.
- **No bespoke rate limiting on the endpoint this iteration.** Tokens are AEAD-sealed (brute force is cryptographically infeasible) and a hit costs one DB read + one presign. Revisit if abuse appears.

## Consequences

- The emailed link contains no S3 key, signature, or identifiers — nothing to leak or tamper with.
- The link remains a bearer credential for its 3-day window: anyone holding the email can download the CSV (user emails, roles, IPs, login history) without authenticating. This is the same trade-off ADR 0004 made, now with revocability and without the dead-link bug.
- URL expiry still does not delete the S3 object; the data-at-rest lifecycle policy noted in ADR 0004 remains outstanding.
- `AUDIT_LOG_EXPORT_URL_EXPIRY_SECONDS` (the 3-day presign) is deleted; `AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS` remains the single source for the Download Window and the email copy, whose "expires in 3 days" wording stays true.
