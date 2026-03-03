import type { LinkTypes } from "./constants"
import { LINK_TYPES } from "./constants"

export const HTTPS_PREFIX = "https://"
type HttpsLink = `https://${string}`

/**
 * Normalises user input to a valid https link using the native URL constructor.
 * - Handles protocol-relative URLs (//host) and avoids malformed hrefs like https:////host.
 * - Validates and normalises output; coerces http to https.
 * - On parse error, falls back to the same string we would have built without URL (no throw).
 */
const HTTP_PREFIX = "http://"

const buildHttpsCandidate = (trimmed: string): string => {
  const lower = trimmed.toLowerCase()
  if (lower.startsWith(HTTPS_PREFIX)) return trimmed

  if (lower.startsWith(HTTP_PREFIX)) {
    return `${HTTPS_PREFIX}${trimmed.slice(HTTP_PREFIX.length)}`
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed.replace(/^\/+/, "//")}`
  }

  return `${HTTPS_PREFIX}${trimmed}`
}

export const generateHttpsLink = (data: string): HttpsLink => {
  const candidate = buildHttpsCandidate(data.trim())

  try {
    const parsed = new URL(candidate, "https://isomer.gov.sg/") // the URL here is a dummy URL because it doesn't matter
    parsed.protocol = "https:"
    return parsed.href as HttpsLink
  } catch {
    return candidate as HttpsLink
  }
}

export const getLinkHrefType = (href: string | undefined): LinkTypes => {
  if (!href) {
    // We default to page if no href is provided, as that is the first option
    return LINK_TYPES.Page
  }

  if (href.startsWith("mailto:")) {
    return LINK_TYPES.Email
  }

  // File links would be pointing to the assets bucket, so they start with a
  // /(\d+)/<uuid>/<filename>
  const fileLinkMatch = /\/(\d+)\/[0-9a-fA-F-]{36}\//.exec(href)
  if (fileLinkMatch?.length === 2) {
    return LINK_TYPES.File
  }

  // Internal links are in the format [resource:$siteId:$pageId]
  // If the href starts with a slash, we consider it an internal page link
  const referenceLinkMatch = /\[resource:(\d+):(\d+)\]/.exec(href)
  if (referenceLinkMatch?.length === 3) {
    return LINK_TYPES.Page
  }

  return LINK_TYPES.External
}
