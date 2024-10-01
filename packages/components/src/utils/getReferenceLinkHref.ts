import DOMPurify from "isomorphic-dompurify"

import type { IsomerSitemap } from "~/types"
import { getSitemapAsArray } from "./getSitemapAsArray"

// This function returns a sanitized version of the provided URL string
const getSanitizedLinkHref = (url?: string) => {
  if (url === undefined) {
    return undefined
  }

  const elem = DOMPurify.sanitize(`<a href="${url}"></a>`, {
    RETURN_DOM_FRAGMENT: true,
  })
  const sanitizedUrl = elem.firstElementChild?.getAttribute("href")

  if (sanitizedUrl === null) {
    return undefined
  }

  return sanitizedUrl
}

// Convert the given reference link to the actual permalink
const getActualLinkFromReference = (
  referenceLink: string,
  sitemap: IsomerSitemap,
) => {
  const sitemapArray = getSitemapAsArray(sitemap)
  const match = /\[resource:(\d+):(\d+)\]/.exec(referenceLink)

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

export const getReferenceLinkHref = (
  referenceLink: string | undefined,
  sitemap: IsomerSitemap,
) => {
  if (!referenceLink) {
    return undefined
  }

  const actualLink = getActualLinkFromReference(referenceLink, sitemap)

  return getSanitizedLinkHref(actualLink)
}
