import type { IsomerSitemap } from "~/types"

export const getSitemapAsArray = (sitemap: IsomerSitemap) => {
  const result: IsomerSitemap[] = []

  const traverse = (node: IsomerSitemap) => {
    if (node.permalink !== undefined && node.permalink !== "") {
      const { children: _children, ...rest } = node
      result.push(rest)
    }
    if (node.children !== undefined && node.children.length > 0) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }

  traverse(sitemap)
  return result
}
