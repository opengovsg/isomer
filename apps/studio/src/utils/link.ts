interface GetReferenceLinkParams {
  siteId: string
  resourceId: string
}

export const getReferenceLink = ({
  siteId,
  resourceId,
}: GetReferenceLinkParams): string => {
  // Check if siteId and resourceId are numbers
  const NUMERIC_REGEX = /^\d+$/
  if (!NUMERIC_REGEX.test(siteId) || !NUMERIC_REGEX.test(resourceId)) {
    return ""
  }

  return `[resource:${siteId}:${resourceId}]`
}
