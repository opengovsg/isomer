export const REFERENCE_LINK_REGEX =
  /\[resource:(?<pageId>\d+):(?<refPageId>\d+)\]/u

export const getResourceIdFromReferenceLink = (
  referenceLink: string,
): string => {
  const match = REFERENCE_LINK_REGEX.exec(referenceLink)
  if (match === null) {
    return ""
  }
  const refPageId = match.groups?.refPageId
  return refPageId ?? ""
}
