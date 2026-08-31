import {
  CONTENT_BLOCK_INDEX_ATTR,
  CONTENT_BLOCKS_SELECTOR,
} from "~/features/editing-experience/constants"

export const getBlockElement = (
  iframeDocument: Document | null,
  index: number | null,
): HTMLElement | undefined => {
  if (index === null || !iframeDocument) {
    return undefined
  }

  return iframeDocument.querySelector(
    `${CONTENT_BLOCKS_SELECTOR} [${CONTENT_BLOCK_INDEX_ATTR}="${index}"]`,
  ) as HTMLElement | undefined
}

export const getContentIndexFromElement = (
  element: Element | null,
): number | null => {
  const marked = element?.closest?.(`[${CONTENT_BLOCK_INDEX_ATTR}]`)
  if (!marked) return null

  const contentIndex = Number(marked.getAttribute(CONTENT_BLOCK_INDEX_ATTR))
  return Number.isNaN(contentIndex) ? null : contentIndex
}
