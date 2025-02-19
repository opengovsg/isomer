import type { IsomerSitemap } from "~/engine"
import type { SiderailProps } from "~/interfaces"
import { getNodeFromSiteMap } from "./getNodeFromSiteMap"

export const getSiderailFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string,
): SiderailProps | null => {
  const parentNode = getNodeFromSiteMap(
    sitemap,
    permalink.split("/").slice(0, -1).join("/"),
  )

  if (!parentNode?.children) {
    // NOTE: This would be unexpected, as we should be able to find the parent
    // and the current page in the sitemap
    return null
  }

  return {
    parentTitle: parentNode.title,
    parentUrl: parentNode.permalink,
    pages: parentNode.children.map((sibling) => ({
      title: sibling.title,
      url: sibling.permalink,
      isCurrent: sibling.permalink === permalink,
    })),
  }
}
