/** Layouts that get their own Next.js route modules at publish time. */
export const HEAVY_LAYOUTS = new Set(["collection", "search", "database"])

/**
 * @typedef {object} SitemapNode
 * @property {string} [permalink]
 * @property {string} [layout]
 * @property {SitemapNode[]} [children]
 */

/**
 * Flatten a nested sitemap tree into a list of nodes (no children).
 * @param {SitemapNode} sitemap
 * @returns {Array<{ permalink: string, layout: string }>}
 */
export function flattenSitemap(sitemap) {
  /** @type {Array<{ permalink: string, layout: string }>} */
  const result = []

  /** @param {SitemapNode} node */
  const walk = (node) => {
    if (typeof node.permalink === "string" && typeof node.layout === "string") {
      result.push({ permalink: node.permalink, layout: node.layout })
    }
    for (const child of node.children ?? []) {
      walk(child)
    }
  }
  walk(sitemap)
  return result
}

/**
 * Normalize a sitemap permalink to the path Next uses under `app/`
 * (no leading/trailing slash). Root `"/"` becomes `""`.
 * @param {string} permalink
 */
export function normalizePermalink(permalink) {
  return permalink.replace(/^\//, "").replace(/\/$/, "")
}

/**
 * Heavy layout landings to codegen: collection / search / database only.
 * @param {SitemapNode} sitemap
 * @returns {Array<{ permalink: string, layout: string, normalized: string }>}
 */
export function getHeavyLayoutRoutes(sitemap) {
  return flattenSitemap(sitemap)
    .filter(({ layout }) => HEAVY_LAYOUTS.has(layout))
    .map(({ permalink, layout }) => ({
      permalink,
      layout,
      normalized: normalizePermalink(permalink),
    }))
    .filter(({ normalized }) => normalized !== "")
}
