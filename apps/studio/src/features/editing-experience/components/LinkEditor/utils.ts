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

  // File links would be pointing to the assets bucket, so they start with a
  // /(\d+)/<uuid>/<filename>
  const fileLinkMatch = /\/(\d+)\/[0-9a-fA-F-]{36}\//.exec(href)
  if (fileLinkMatch?.length === 2) {
    return LINK_TYPES.File
  }

  // Internal links are in the format [resource:$siteId:$pageId]
  // If the href starts with a slash, we consider it an internal page link
  const referenceLinkMatch = /\[resource:(\d+):(\d+)\]/.exec(href)
  if (referenceLinkMatch?.length === 3) {
    return LINK_TYPES.Page
  }

  return LINK_TYPES.External
}
