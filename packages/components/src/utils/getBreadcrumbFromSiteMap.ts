import type { BreadcrumbProps } from "~/interfaces"
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

// Traverse the sitemap to get the breadcrumb for the page with the given
// permalink
export const getBreadcrumbFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string[],
): BreadcrumbProps => {
  const breadcrumb = [
    {
      title: "Home",
      url: "/",
    },
  ]
  let currentNode = sitemap
  let currentPath = ""

  for (const pathSegment of permalink) {
    currentPath += `/${pathSegment}`
    const childNode = findChildByPermalink(currentNode.children, currentPath)

    if (childNode === undefined) {
      // Handle unexpected case where we cannot traverse to permalink in the sitemap
      break
    }

    currentNode = childNode
    breadcrumb.push({
      title: currentNode.title,
      url: currentNode.permalink,
    })
  }

  return { links: breadcrumb }
}
