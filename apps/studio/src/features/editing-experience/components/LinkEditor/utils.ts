export const getLinkHrefType = (href: string | undefined) => {
  if (!href) {
    // We default to page if no href is provided, as that is the first option
    return "page"
  }

  if (href.startsWith("mailto:")) {
    return "email"
  }

  // Internal links are in the format [resource:$siteId:$pageId]
  const referenceLinkMatch = href.match(/\[resource:(\d+):(\d+)\]/)
  if (referenceLinkMatch && referenceLinkMatch.length === 3) {
    return "page"
  }

  // File links would be pointing to the assets bucket, so they start with a /
  if (href.startsWith("/")) {
    return "file"
  }

  return "external"
}
