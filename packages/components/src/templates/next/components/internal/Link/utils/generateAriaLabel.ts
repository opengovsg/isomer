import type { LinkProps } from "~/interfaces/internal/Link"

type GenerateAriaLabelProps = Pick<LinkProps, "isExternal" | "label">

const getDomainFromUrl = (url: LinkProps["href"]) => {
  if (!url) return ""

  const urlObj = new URL(url)
  return urlObj.hostname
}

const isUrl = (label: LinkProps["label"]) => {
  if (!label) return false

  try {
    new URL(label)
    return true
  } catch {
    return false
  }
}

export const generateAriaLabel = ({
  label,
  isExternal = false,
}: GenerateAriaLabelProps) => {
  if (isUrl(label) && isExternal) {
    return `Link to ${getDomainFromUrl(label)} (opens in new tab)`
  }

  if (isUrl(label)) {
    return `Link to ${getDomainFromUrl(label)}`
  }

  return label
}
