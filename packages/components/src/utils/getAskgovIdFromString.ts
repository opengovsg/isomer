const ASKGOV_HOSTNAMES = new Set(["ask.gov.sg", "www.ask.gov.sg"])
const SCHEMELESS_ASKGOV_DOMAIN_PATTERN =
  /^(?:[a-z0-9-]+\.)*ask\.gov\.sg(?:[./?#]|$)/i

/**
 * Returns an AskGov agency ID unchanged, or extracts it from a supported URL.
 * URL inputs must use HTTP(S), have an accepted hostname, and include the
 * agency ID as the first path segment.
 */
export const getAskgovIdFromString = (value: string): string | null => {
  const valueToParse = value.includes("://")
    ? value
    : SCHEMELESS_ASKGOV_DOMAIN_PATTERN.test(value)
      ? `https://${value}`
      : null

  if (!valueToParse) return value

  try {
    const url = new URL(valueToParse)

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !ASKGOV_HOSTNAMES.has(url.hostname)
    ) {
      return null
    }

    return url.pathname.split("/")[1] || null
  } catch {
    return null
  }
}
