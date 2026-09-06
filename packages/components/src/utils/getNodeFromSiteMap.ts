import type { IsomerSitemap } from "~/types"

const findChildByPermalink = (
  children: IsomerSitemap[] | undefined,
  permalink: string,
): IsomerSitemap | undefined => {
  if (children === undefined) {
    return undefined
  }

  for (const child of children) {
    if (child.permalink === permalink) {
      return child
    }
  }

  return undefined
}

// This function traverses through the sitemap to find the node that corresponds
// to the given permalink
export const getNodeFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string,
): IsomerSitemap | null => {
  const permalinkParts = permalink.split("/").filter((part) => part !== "")

  let currentNode = sitemap
  let currentPath = ""
  let index = 0

  while (index < permalinkParts.length) {
    currentPath += `/${permalinkParts[index]}`
    const childNode = findChildByPermalink(currentNode.children, currentPath)

    if (childNode === undefined) {
      // NOTE: This would be unexpected, as we should be able to traverse to the
      // node that corresponds to the permalink
      return null
    }

    currentNode = childNode
    index += 1
  }

  return currentNode
}
