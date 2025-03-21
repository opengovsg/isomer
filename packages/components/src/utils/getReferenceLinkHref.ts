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
const convertReferenceLinks = (
  originalLink: string,
  sitemap: IsomerSitemap,
) => {
  const sitemapArray = getSitemapAsArray(sitemap)
  const match = /^\[resource:(\d+):(\d+)\]/.exec(originalLink)

  if (!match) {
    return originalLink
  }

  const refPageId = match[2]

  if (!refPageId) {
    return originalLink
  }

  const refPage = sitemapArray.find(({ id }) => id === refPageId)

  if (!refPage) {
    return originalLink
  }

  return refPage.permalink
}

// Prepend the assets base URL for asset links
// Asset links are assumed to start with /{site_id}/
const convertAssetLinks = (
  originalLink: string,
  assetsBaseUrl: string | undefined,
) => {
  if (!assetsBaseUrl) {
    return originalLink
  }

  const match =
    /^\/(\d+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//.exec(
      originalLink,
    )

  if (!match) {
    return originalLink
  }

  return `${assetsBaseUrl}${originalLink}`
}

export const getReferenceLinkHref = (
  referenceLink: string | undefined,
  sitemap: IsomerSitemap,
  assetsBaseUrl: string | undefined,
) => {
  if (!referenceLink) {
    return undefined
  }

  const assetLink = convertAssetLinks(referenceLink, assetsBaseUrl)
  const actualLink = convertReferenceLinks(assetLink, sitemap)

  return getSanitizedLinkHref(actualLink)
}
