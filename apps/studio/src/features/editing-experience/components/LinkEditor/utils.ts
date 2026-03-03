import type { LinkTypes } from "./constants"
import { LINK_TYPES } from "./constants"

export const getLinkHrefType = (href: string | undefined): LinkTypes => {
  if (!href) {
    // We default to page if no href is provided, as that is the first option
    return LINK_TYPES.Page
  }

  if (href.startsWith("mailto:")) {
    return LINK_TYPES.Email
  }

  // File links point to the assets bucket: path-only format /(\d+)/<uuid>/<filename>.
  // Never treat full URLs as internal file links (avoids external URLs with this
  // pattern being misclassified and shown as filename-only in the UI).
  const isFullUrl = href.startsWith("http://") || href.startsWith("https://")
  if (!isFullUrl) {
    const fileLinkMatch = /^\/(\d+)\/[0-9a-fA-F-]{36}\//.exec(href)
    if (fileLinkMatch?.length === 2) {
      return LINK_TYPES.File
    }
  }

  // Internal links are in the format [resource:$siteId:$pageId]
  // If the href starts with a slash, we consider it an internal page link
  const referenceLinkMatch = /\[resource:(\d+):(\d+)\]/.exec(href)
  if (referenceLinkMatch?.length === 3) {
    return LINK_TYPES.Page
  }

  return LINK_TYPES.External
}
