interface GetReferenceLinkParams {
  siteId: string
  resourceId: string
}

export const getReferenceLink = ({
  siteId,
  resourceId,
}: GetReferenceLinkParams): string => {
  return `[resource:${siteId}:${resourceId}]`
}

export const getResourceIdFromReferenceLink = (
  referenceLink: string,
): string => {
  const match = referenceLink.match(/\[resource:(\d+):(\d+)\]/)
  if (!match) {
    return ""
  }
  return match[2] || ""
}
