export const TOPPAN_EMAIL_DOMAIN = "@toppannext.com"

// Grants gazette access only; route pinning and email suppression stay Toppan-only.
const GAZETTE_ACCESS_EMAIL_DOMAINS = [
  TOPPAN_EMAIL_DOMAIN,
  "@open.gov.sg",
  "@imda.gov.sg",
]

export const hasGazetteAccessEmailDomain = (email: string): boolean =>
  GAZETTE_ACCESS_EMAIL_DOMAINS.some((domain) => email.endsWith(domain))
