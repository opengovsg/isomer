import type { IsomerSitemap } from "~/types"

// This function traverses through the sitemap to find the node that corresponds
// to the given permalink
export const getNodeFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string,
): IsomerSitemap | null => {
  const permalinkParts = permalink.split("/").filter((part) => part !== "")

  let node = sitemap
  let currentPath = ""
  let i = 0

  while (i < permalinkParts.length) {
    currentPath += "/" + permalinkParts[i]
    const nextNode = node.children?.find(
      (node) => node.permalink === currentPath,
    )

    if (!nextNode) {
      // NOTE: This would be unexpected, as we should be able to traverse to the
      // node that corresponds to the permalink
      return null
    }

    node = nextNode
    i++
  }

  return node
}
