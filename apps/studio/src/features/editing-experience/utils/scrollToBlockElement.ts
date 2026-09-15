import { getBlockElement } from "./getBlockElement"

interface ScrollToBlockElementParams {
  iframeDocument: Document | null
  index: number | null
}

export const scrollToBlockElement = ({
  iframeDocument,
  index,
}: ScrollToBlockElementParams): void => {
  const blockEl = getBlockElement(iframeDocument, index)
  blockEl?.scrollIntoView({ behavior: "smooth", block: "nearest" })
}
