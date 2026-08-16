import { getBlockElement } from "./getBlockElement"

export const scrollToBlockElement = (
  iframeDocument: Document | null,
  index: number | null,
): void => {
  const blockEl = getBlockElement(iframeDocument, index)
  blockEl?.scrollIntoView({ behavior: "smooth", block: "nearest" })
}
