import type { LinkProps } from "~/interfaces/internal/Link"

type GenerateAriaLabelProps = Pick<LinkProps, "isExternal" | "label"> & {
  textContent?: string
}

const patchUrlTextContent = (textContent: string): string => {
  if (!textContent) return textContent

  // Check if the URL already has any protocol (not just http)
  if (!/^[a-z]+:\/\//i.test(textContent)) {
    // Only prepend https:// if the string looks URL-like
    if (textContent.includes(".") || textContent.startsWith("www.")) {
      return `https://${textContent.startsWith("www.") ? "" : "www."}${textContent}`
    }
  }

  return textContent
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

  const patchedTextContent = patchUrlTextContent(textContent)

  if (isUrl(patchedTextContent) && isExternal) {
    return `Link to ${getDomainFromUrl(patchedTextContent)} (opens in new tab)`
  }

  if (isUrl(patchedTextContent)) {
    return `Link to ${getDomainFromUrl(patchedTextContent)}`
  }
}
