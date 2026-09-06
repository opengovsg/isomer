import type { IsomerSitemap } from "~/types"
import { sanitize } from "isomorphic-dompurify"

const REFERENCE_LINK_PREFIX_REGEX =
  /^\[resource:(?<pageId>\d+):(?<refPageId>\d+)\]/u

const ASSET_LINK_PREFIX_REGEX =
  /^\/(?<siteId>\d+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//u

// This function returns a sanitized version of the provided URL string
const getSanitizedLinkHref = (url?: string): string | undefined => {
  if (url === undefined) {
    return undefined
  }

  // We use DOMPurify to create the document fragment as Node.js has no browser 'document' object.
  const fragment = sanitize("<a></a>", { RETURN_DOM_FRAGMENT: true })
  const anchor = fragment.firstElementChild

  if (anchor === null) {
    return undefined
  }

  anchor.setAttribute("href", url)
  sanitize(anchor, { IN_PLACE: true })

  const sanitizedUrl = anchor.getAttribute("href")

  if (sanitizedUrl === null) {
    return undefined
  }

  return sanitizedUrl
}

// Convert the given reference link to the actual permalink
const convertReferenceLinks = (
  originalLink: string,
  sitemapArray: IsomerSitemap[],
) => {
  const match = REFERENCE_LINK_PREFIX_REGEX.exec(originalLink)

  if (match === null) {
    return originalLink
  }

  const refPageId = match.groups?.refPageId

  if (refPageId === undefined || refPageId === "") {
    return originalLink
  }

  const refPage = sitemapArray.find(({ id }) => id === refPageId)

  if (refPage === undefined) {
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
  if (assetsBaseUrl === undefined || assetsBaseUrl === "") {
    return originalLink
  }

  const match = ASSET_LINK_PREFIX_REGEX.exec(originalLink)

  if (match === null) {
    return originalLink
  }

  return `${assetsBaseUrl}${originalLink}`
}

export const getReferenceLinkHref = (
  referenceLink: string | undefined,
  sitemapArray: IsomerSitemap[],
  assetsBaseUrl: string | undefined,
): string | undefined => {
  if (referenceLink === undefined || referenceLink === "") {
    return undefined
  }

  const assetLink = convertAssetLinks(referenceLink, assetsBaseUrl)
  const actualLink = convertReferenceLinks(assetLink, sitemapArray)

  return getSanitizedLinkHref(actualLink)
}
