import { ALT_TEXT_REGEX_PATTERN } from "@opengovsg/isomer-components"

const altTextPattern = new RegExp(ALT_TEXT_REGEX_PATTERN)

export const isAltTextAcceptedByFormSchema = (altText: string): boolean =>
  altTextPattern.test(altText)
