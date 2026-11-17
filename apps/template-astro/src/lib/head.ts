import type { getMetadata } from "@opengovsg/isomer-components"

type Metadata = ReturnType<typeof getMetadata>

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

const meta = (attr: "name" | "property", key: string, content?: string) =>
  content ? `<meta ${attr}="${key}" content="${esc(content)}">` : ""

const link = (rel: string, href?: string, extra = "") =>
  href ? `<link rel="${rel}" href="${esc(href)}"${extra}>` : ""

// Renders the subset of Next's Metadata API that isomer-components' getMetadata() produces,
// matching the tags Next emits (title template "%s | siteName" from apps/template's layout).
export const renderHead = (metadata: Metadata, siteName: string) => {
  const absolute = (url?: string) =>
    url && metadata.metadataBase
      ? new URL(url, metadata.metadataBase).toString()
      : url
  const og = metadata.openGraph
  const rss = metadata.alternates.types?.["application/rss+xml"] ?? []

  return [
    `<title>${esc(metadata.title ? `${metadata.title} | ${siteName}` : siteName)}</title>`,
    meta("name", "description", metadata.description),
    meta("name", "robots", metadata.robots.index ? "index" : "noindex"),
    link("canonical", absolute(metadata.alternates.canonical)),
    ...rss.map((r) =>
      link(
        "alternate",
        absolute(r.url),
        ` type="application/rss+xml" title="${esc(r.title)}"`,
      ),
    ),
    meta("property", "og:title", og.title),
    meta("property", "og:description", og.description),
    meta("property", "og:url", absolute(og.url)),
    meta("property", "og:site_name", og.siteName),
    ...(og.images ?? []).map((i) =>
      meta("property", "og:image", absolute(i.url)),
    ),
    meta("property", "og:type", og.type),
    meta("name", "twitter:card", metadata.twitter.card),
    meta("name", "twitter:title", og.title),
    meta("name", "twitter:description", og.description),
    ...(og.images ?? []).map((i) =>
      meta("name", "twitter:image", absolute(i.url)),
    ),
    link("shortcut icon", metadata.icons.shortcut),
    link("icon", metadata.icons.icon),
  ]
    .filter(Boolean)
    .join("")
}
