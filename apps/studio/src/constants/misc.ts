export const ISOMER_SUPPORT_EMAIL = "support@isomer.gov.sg"
export const ISOMER_SUPPORT_LINK = `mailto:${ISOMER_SUPPORT_EMAIL}`

// How long a signed audit-log export download URL stays valid. Single source
// of truth for both the S3 presign expiry (~/lib/s3) and the email copy that
// tells the requester when the link dies (~/features/mail).
export const AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS = 3
