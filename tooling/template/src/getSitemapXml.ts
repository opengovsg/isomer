import type { IsomerSitemap } from "@opengovsg/isomer-components"

const getSitemapAsArray = (sitemap: IsomerSitemap) => {
  const result: IsomerSitemap[] = []

  const traverse = (node: IsomerSitemap) => {
    if (node.permalink) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export const getSitemapXml = (sitemap: IsomerSitemap, siteUrl?: string) => {
  return getSitemapAsArray(sitemap)
    .filter((item) => item.layout !== "file" && item.layout !== "link")
    .map(({ permalink, lastModified }) => ({
      url: siteUrl !== undefined ? `${siteUrl}${permalink}` : permalink,
      lastModified,
    }))
}
