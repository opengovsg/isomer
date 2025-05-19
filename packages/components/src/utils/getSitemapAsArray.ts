import type { IsomerSitemap } from "~/engine"

export const getSitemapAsArray = (sitemap: IsomerSitemap) => {
  const result: IsomerSitemap[] = []

  const traverse = (node: IsomerSitemap) => {
    if (node.permalink) {
      const { children, ...rest } = node
      result.push(rest)
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => traverse(child))
    }
  }

  traverse(sitemap)
  return result
}
