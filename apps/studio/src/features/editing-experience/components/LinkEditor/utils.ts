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

  // Internal links are in the format [resource:$siteId:$pageId]
  const referenceLinkMatch = /\[resource:(\d+):(\d+)\]/.exec(href)
  if (referenceLinkMatch && referenceLinkMatch.length === 3) {
    return LINK_TYPES.Page
  }

  // File links would be pointing to the assets bucket, so they start with a /
  if (href.startsWith("/")) {
    return LINK_TYPES.File
  }

  return LINK_TYPES.External
}
