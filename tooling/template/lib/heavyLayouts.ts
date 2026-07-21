/** Layouts that get their own Next.js route modules at publish time. */
export const HEAVY_LAYOUTS = new Set(["collection", "search", "database"])

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
