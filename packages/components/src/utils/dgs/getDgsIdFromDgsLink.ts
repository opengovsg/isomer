import { DGS_LINK_REGEX } from "./constants"

export const getDgsIdFromDgsLink = (dgsLink: string): string | null => {
  const match = DGS_LINK_REGEX.exec(dgsLink)
  if (match === null) {
    return null
  }
  const dgsId = match.groups?.dgsId
  return dgsId ?? null
}
