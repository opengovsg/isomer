import type { IsomerSitemap } from "~/engine"
import type { SiderailProps } from "~/interfaces"

export const getSiderailFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string[],
): SiderailProps | null => {
  let node = sitemap
  let currentPath = ""

  let i = 0
  while (i < permalink.length - 1) {
    currentPath += "/" + permalink[i]
    const nextNode = node.children?.find(
      (node) => node.permalink === currentPath,
    )
    if (!nextNode) {
      // TODO: handle this unexpected case where cannot traverse to parent in the sitemap
      return null
    }
    node = nextNode
    i++
  }
  if (!node.children) {
    // TODO: handle this unexpected case where parent does not contain current page
    return null
  }
  const parentTitle = node.title
  const parentUrl = node.permalink

  // get all siblings of page
  const pagePath = "/" + permalink.join("/")
  const pages = node.children.map((sibling) => ({
    title: sibling.title,
    url: sibling.permalink,
    isCurrent: sibling.permalink === pagePath,
    childPages: sibling.children?.map((child) => ({
      url: child.permalink,
      title: child.title,
    })),
  }))

  return {
    parentTitle,
    parentUrl,
    pages,
  }
}
