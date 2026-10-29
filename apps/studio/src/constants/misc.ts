export const ISOMER_SUPPORT_EMAIL = "support@isomer.gov.sg"
export const ISOMER_SUPPORT_LINK = `mailto:${ISOMER_SUPPORT_EMAIL}`

// How long an audit-log export stays downloadable — the Download Window shown
// to users. Single source of truth for that window: the email copy that tells
// the requester when the link dies (~/features/mail) and the download-token TTL
// are both derived from it. It is NOT the S3 presign expiry: the click-time
// presign (~/lib/s3) uses its own short default, since the URL is signed fresh
// on each redemption rather than once at export time.
// NOTE: the exported CSV objects themselves are deleted 7 days after upload
// by an S3 lifecycle rule in isomer-next-infra (src/s3/index.ts, rule
// `expire-audit-log-exports` on the `audit-log-exports/` prefix). Raising
// this constant past that window — or reusing an artifact late in its life
// (ADR 0005) — produces links that outlive the object; keep the infra expiry
// comfortably above this value.
export const AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS = 3

// NOTE: Hardcoded for now as a proof of concept
export const MOE_SITES = [
  "https://test-isomer-next-staging.isomer.gov.sg",
  "https://test-isomer-vica-staging.isomer.gov.sg",
  "https://test-isomer-vica-ncss-staging.isomer.gov.sg",
]
