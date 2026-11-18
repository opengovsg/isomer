import type { IsomerSitemap } from "~/types"

import { getCachedSitemapArray } from "./sitemapArrayCache"

const flattenSitemap = (sitemap: IsomerSitemap) => {
  const result: IsomerSitemap[] = []

  const traverse = (node: IsomerSitemap) => {
    if (node.permalink) {
      const { children: _children, ...rest } = node
      result.push(rest)
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => traverse(child))
    }
  }

  traverse(sitemap)
  return result
}

export const getSitemapAsArray = (sitemap: IsomerSitemap) =>
  getCachedSitemapArray(sitemap, flattenSitemap)
