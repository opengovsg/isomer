import type { BreadcrumbProps } from "~/common"
import type { IsomerSitemap } from "~/engine"

// Traverse the sitemap to get the breadcrumb for the page with the given
// permalink
export const getBreadcrumbFromSiteMap = (
  sitemap: IsomerSitemap,
  permalink: string[],
): BreadcrumbProps => {
  const breadcrumb = []
  let node = sitemap
  let currentPath = ""

  for (const pathSegment of permalink) {
    currentPath += "/" + pathSegment
    const nextNode = node.children?.find(
      (node) => node.permalink === currentPath,
    )

    if (!nextNode) {
      // TODO: handle this unexpected case where cannot traverse to permalink in the sitemap
      break
    }

    node = nextNode
    breadcrumb.push({
      title: node.title,
      url: node.permalink,
    })
  }

  return { links: breadcrumb }
}
