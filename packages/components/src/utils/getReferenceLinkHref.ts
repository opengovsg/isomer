import type { IsomerSitemap } from "~/types"
import DOMPurify from "isomorphic-dompurify"

const anchor = DOMPurify.sanitize("<a></a>", {
  RETURN_DOM_FRAGMENT: true,
}).firstElementChild

export const getSanitizedLinkHref = (url?: string) => {
  if (url === undefined || !anchor) {
    return undefined
  }

  anchor.setAttribute("href", url)
  DOMPurify.sanitize(anchor, { IN_PLACE: true })

  const sanitizedUrl = anchor.getAttribute("href")

  if (sanitizedUrl === null) {
    return undefined
  }

  return sanitizedUrl
}

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

const assetLinkPrefix =
  /^\/(\d+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//

const convertAssetLinks = (
  originalLink: string,
  assetsBaseUrl: string | undefined,
) => {
  if (!assetsBaseUrl) {
    return originalLink
  }

  const match = assetLinkPrefix.exec(originalLink)

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
