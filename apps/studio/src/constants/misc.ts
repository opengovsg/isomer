export const ISOMER_SUPPORT_EMAIL = "support@isomer.gov.sg"
export const ISOMER_SUPPORT_LINK = `mailto:${ISOMER_SUPPORT_EMAIL}`

// How long a signed audit-log export download URL stays valid. Single source
// of truth for both the S3 presign expiry (~/lib/s3) and the email copy that
// tells the requester when the link dies (~/features/mail).
// NOTE: the exported CSV objects themselves are deleted 7 days after upload
// by an S3 lifecycle rule in isomer-next-infra (src/s3/index.ts, rule
// `expire-audit-log-exports` on the `audit-log-exports/` prefix). Raising
// this constant past that window — or reusing an artifact late in its life
// (ADR 0005) — produces links that outlive the object; keep the infra expiry
// comfortably above this value.
export const AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS = 3
