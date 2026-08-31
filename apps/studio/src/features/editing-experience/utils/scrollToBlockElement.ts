import type { IsomerSchema } from "@opengovsg/isomer-components"

import { getBlockElement } from "./getBlockElement"

interface ScrollToBlockElementParams {
  iframeDocument: Document | null
  content: IsomerSchema["content"]
  index: number | null
}

export const scrollToBlockElement = ({
  iframeDocument,
  content,
  index,
}: ScrollToBlockElementParams): void => {
  const blockEl = getBlockElement(iframeDocument, content, index)
  blockEl?.scrollIntoView({ behavior: "smooth", block: "nearest" })
}
