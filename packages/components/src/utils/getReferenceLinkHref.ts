import type { IsomerSitemap } from "~/types"

import { sanitizeLinkHref } from "./sanitize"

const getSanitizedLinkHref = (url?: string): string | undefined => {
  if (!url) {
    return undefined
  }
  return sanitizeLinkHref(url)
}

// Convert the given reference link to the actual permalink
const convertReferenceLinks = (
  originalLink: string,
  sitemapArray: IsomerSitemap[],
) => {
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
  sitemapArray: IsomerSitemap[],
  assetsBaseUrl: string | undefined,
) => {
  if (!referenceLink) {
    return undefined
  }

  const assetLink = convertAssetLinks(referenceLink, assetsBaseUrl)
  const actualLink = convertReferenceLinks(assetLink, sitemapArray)

  return getSanitizedLinkHref(actualLink)
}
