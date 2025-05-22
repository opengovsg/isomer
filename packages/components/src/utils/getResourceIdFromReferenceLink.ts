export const REFERENCE_LINK_REGEX = /\[resource:(\d+):(\d+)\]/

export const getResourceIdFromReferenceLink = (
  referenceLink: string,
): string => {
  const match = REFERENCE_LINK_REGEX.exec(referenceLink)
  if (!match) {
    return ""
  }
  return match[2] || ""
}
