import {
  LINK_TYPE_EMAIL,
  LINK_TYPE_EXTERNAL,
  LINK_TYPE_FILE,
  LINK_TYPE_PAGE,
} from "./constants"

export const getLinkHrefType = (href: string | undefined) => {
  if (!href) {
    // We default to page if no href is provided, as that is the first option
    return LINK_TYPE_PAGE
  }

  if (href.startsWith("mailto:")) {
    return LINK_TYPE_EMAIL
  }

  // Internal links are in the format [resource:$siteId:$pageId]
  const referenceLinkMatch = /\[resource:(\d+):(\d+)\]/.exec(href)
  if (referenceLinkMatch && referenceLinkMatch.length === 3) {
    return LINK_TYPE_PAGE
  }

  // File links would be pointing to the assets bucket, so they start with a /
  if (href.startsWith("/")) {
    return LINK_TYPE_FILE
  }

  return LINK_TYPE_EXTERNAL
}
