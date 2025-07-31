import { DGS_LINK_REGEX } from "./constants"

export const getDgsIdFromDgsLink = (dgsLink: string): string => {
  const match = DGS_LINK_REGEX.exec(dgsLink)
  if (!match) {
    return ""
  }
  return match[1] || ""
}
