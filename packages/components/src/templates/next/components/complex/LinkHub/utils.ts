// NOTE: This mirrors the `files` pattern in `~/utils/validation.ts` and
// should remain in sync with it.
const FILE_HREF_REGEX =
  /^\/(\d+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//

export type LinkHubLinkType = "file" | "external" | "internal" | "email" | "tel"

export const getLinkHubLinkType = (href: string): LinkHubLinkType => {
  if (href.startsWith("tel:")) return "tel"
  if (href.startsWith("mailto:")) return "email"
  if (FILE_HREF_REGEX.test(href)) return "file"
  if (href.startsWith("https://")) return "external"
  return "internal"
}

export const getFileNameFromHref = (href: string): string => {
  const segments = href.split("/")
  return decodeURIComponent(segments[segments.length - 1] ?? "")
}
