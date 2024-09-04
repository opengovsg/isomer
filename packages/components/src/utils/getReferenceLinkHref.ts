import type { IsomerSitemap } from "~/types"
import { getSitemapAsArray } from "./getSitemapAsArray"

// Convert the given reference link to the actual permalink
export const getReferenceLinkHref = (
  referenceLink: string | undefined,
  sitemap: IsomerSitemap,
) => {
  if (!referenceLink) {
    return undefined
  }

  const sitemapArray = getSitemapAsArray(sitemap)
  const match = referenceLink.match(/\[resource:(\d+):(\d+)\]/)

  if (!match) {
    return referenceLink
  }

  const refPageId = match[2]

  if (!refPageId) {
    return referenceLink
  }

  const refPage = sitemapArray.find(({ id }) => id === refPageId)

  if (!refPage) {
    return referenceLink
  }

  return refPage.permalink
}
