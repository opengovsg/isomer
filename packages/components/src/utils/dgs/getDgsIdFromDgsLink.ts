import { DGS_LINK_REGEX } from "./constants"

export const getDgsIdFromDgsLink = (dgsLink: string): string | null => {
  const match = DGS_LINK_REGEX.exec(dgsLink)
  if (!match) {
    return null
  }
  return match[1] || null
}
