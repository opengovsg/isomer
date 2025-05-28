import type { LinkProps } from "~/interfaces/internal/Link"

type GenerateAriaLabelProps = Pick<LinkProps, "isExternal" | "label"> & {
  textContent?: string
}

const doesNotHaveProtocol = (textContent: string) => {
  return (
    !textContent.startsWith("http://") &&
    !textContent.startsWith("https://") &&
    !textContent.includes("://")
  )
}

// The only common and known URL pattern is:
// 1. subdomain with www.
// 2. domain with .com
// While there's no guarantee that this text is a website, it's a good guess
// This is unlikely other patterns like "isomer.xyz"
const doesLookLikeUrl = (textContent: string) => {
  return textContent.startsWith("www.") || textContent.endsWith(".com")
}

const patchUrlTextContent = (textContent: string): string => {
  if (!textContent) return textContent

  // Only prepend https:// if the string looks URL-like
  if (doesNotHaveProtocol(textContent) && doesLookLikeUrl(textContent)) {
    return `https://${textContent}` // Adding HTTPS as this is only used for checks against new URL() method
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

  if (textContent === undefined) return undefined
  if (textContent.trim() === "") return undefined

  const MAILTO_TEXT = "mailto:"
  if (textContent.startsWith(MAILTO_TEXT)) {
    return `Send an email to ${textContent.slice(MAILTO_TEXT.length)}`
  }

  const patchedTextContent = patchUrlTextContent(textContent)

  if (isUrl(patchedTextContent) && isExternal) {
    return `Link to ${getDomainFromUrl(patchedTextContent)} (opens in new tab)`
  }

  if (isUrl(patchedTextContent)) {
    return `Link to ${getDomainFromUrl(patchedTextContent)}`
  }
}
