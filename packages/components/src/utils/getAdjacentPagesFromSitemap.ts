import type { IsomerSitemap } from "~/engine"
import type { PagerProps } from "~/interfaces"
import { getNodeFromSiteMap } from "./getNodeFromSiteMap"

export const getAdjacentPagesFromSitemap = (
  sitemap: IsomerSitemap,
  permalink: string,
): PagerProps | null => {
  const parentNode = getNodeFromSiteMap(
    sitemap,
    permalink.split("/").slice(0, -1).join("/"),
  )
  if (!parentNode) return null

  const siblings = parentNode.children
  if (!siblings || siblings.length === 0) return null

  const currentIndex = siblings.findIndex(
    (sibling) => sibling.permalink === permalink,
  )
  if (currentIndex === -1) return null

  const prevSibling = siblings[currentIndex - 1]
  const nextSibling = siblings[currentIndex + 1]

  const previousPage = prevSibling
    ? { title: prevSibling.title, url: prevSibling.permalink }
    : undefined

  const nextPage = nextSibling
    ? { title: nextSibling.title, url: nextSibling.permalink }
    : undefined
  return { previousPage, nextPage }
}
