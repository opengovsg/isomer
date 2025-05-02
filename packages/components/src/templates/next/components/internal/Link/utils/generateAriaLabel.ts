import type { LinkProps } from "~/interfaces/internal/Link"

type GenerateAriaLabelProps = Pick<LinkProps, "isExternal" | "label"> & {
  textContent?: string
}

const getDomainFromUrl = (url: string) => {
  if (!url) return ""

  const urlObj = new URL(url)
  return urlObj.hostname
}

const isUrl = (textContent: string) => {
  if (!textContent) return false

  try {
    new URL(textContent)
    return true
  } catch {
    return false
  }
}

export const generateAriaLabel = ({
  label,
  textContent,
  isExternal = false,
}: GenerateAriaLabelProps): string | undefined => {
  if (label) return label

  if (!textContent) return undefined

  if (isUrl(textContent) && isExternal) {
    return `Link to ${getDomainFromUrl(textContent)} (opens in new tab)`
  }

  if (isUrl(textContent)) {
    return `Link to ${getDomainFromUrl(textContent)}`
  }
}
