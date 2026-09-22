import {
  CONTENT_BLOCK_INDEX_ATTR,
  CONTENT_BLOCKS_SELECTOR,
} from "~/features/editing-experience/constants"

export interface BlockHighlightRect {
  top: number
  left: number
  width: number
  height: number
}

export const getBlockElements = (
  iframeDocument: Document | null,
  index: number | null,
): HTMLElement[] => {
  if (index === null || !iframeDocument) {
    return []
  }

  return Array.from(
    iframeDocument.querySelectorAll<HTMLElement>(
      `${CONTENT_BLOCKS_SELECTOR} [${CONTENT_BLOCK_INDEX_ATTR}="${index}"]`,
    ),
  )
}

export const getBlockElement = (
  iframeDocument: Document | null,
  index: number | null,
): HTMLElement | undefined => {
  return getBlockElements(iframeDocument, index)[0]
}

export const getBlockHighlightRect = (
  iframeDocument: Document | null,
  index: number | null,
): BlockHighlightRect | undefined => {
  const elements = getBlockElements(iframeDocument, index)
  if (elements.length === 0 || !iframeDocument) {
    return undefined
  }

  const scrollX = iframeDocument.defaultView?.scrollX ?? 0
  const scrollY = iframeDocument.defaultView?.scrollY ?? 0

  let top = Infinity
  let left = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (const el of elements) {
    const r = el.getBoundingClientRect()
    top = Math.min(top, r.top)
    left = Math.min(left, r.left)
    right = Math.max(right, r.right)
    bottom = Math.max(bottom, r.bottom)
  }

  return {
    top: top + scrollY,
    left: left + scrollX,
    width: right - left,
    height: bottom - top,
  }
}

export const getContentIndexFromElement = (
  element: Element | null,
): number | null => {
  const marked = element?.closest?.(`[${CONTENT_BLOCK_INDEX_ATTR}]`)
  if (!marked) return null

  const contentIndex = Number(marked.getAttribute(CONTENT_BLOCK_INDEX_ATTR))
  return Number.isNaN(contentIndex) ? null : contentIndex
}
