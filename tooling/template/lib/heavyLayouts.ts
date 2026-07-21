import heavyLayoutTypes from "./heavy-layout-types.json"

/** Layouts that get their own Next.js route modules at publish time. */
export const HEAVY_LAYOUTS = new Set<string>(heavyLayoutTypes)

interface SitemapNode {
  permalink?: string
  layout?: string
  children?: SitemapNode[]
}

export function normalizePermalink(permalink: string): string {
  return permalink.replace(/^\//, "").replace(/\/$/, "")
}

/**
 * Exact landing permalinks (normalized, no leading/trailing slash) for
 * collection / search / database pages. Used to exclude them from the
 * light catch-all's `generateStaticParams`.
 */
export function getHeavyNormalizedPermalinks(
  sitemap: SitemapNode,
): Set<string> {
  const result = new Set<string>()

  const walk = (node: SitemapNode) => {
    if (
      typeof node.permalink === "string" &&
      typeof node.layout === "string" &&
      HEAVY_LAYOUTS.has(node.layout)
    ) {
      const normalized = normalizePermalink(node.permalink)
      if (normalized !== "") result.add(normalized)
    }
    for (const child of node.children ?? []) {
      walk(child)
    }
  }

  walk(sitemap)
  return result
}

/**
 * Drop heavy-layout landings from catch-all static params so `output: "export"`
 * does not emit the same HTML from both the catch-all and `app/(heavy)/`.
 * Article children under a collection prefix are kept.
 */
export function excludeHeavyFromCatchAllUrls(
  urls: string[],
  sitemap: SitemapNode,
): string[] {
  const excluded = getHeavyNormalizedPermalinks(sitemap)
  return urls
    .map((url) => normalizePermalink(url))
    .filter((normalized) => !excluded.has(normalized))
}
