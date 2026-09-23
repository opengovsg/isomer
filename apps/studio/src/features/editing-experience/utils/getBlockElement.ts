import type { IsomerSchema } from "@opengovsg/isomer-components"

// packages/components' renderPageContent filters out hidden childrenpages
// blocks before rendering, so a hidden childrenpages block never reaches the
// DOM and every block after it is shifted up by one. Mirror that filter here
// so we can translate a `content` index into the matching DOM child index.
const isHiddenChildrenPagesBlock = (
  block: IsomerSchema["content"][number],
): boolean => block.type === "childrenpages" && !!block.isHidden

// Blocks aren't individually wrapped (that broke the `first:mt-*`-style
// spacing most block components use), so instead we index directly into
// the children of the shared content container.
export const getBlockElement = (
  iframeDocument: Document | null,
  content: IsomerSchema["content"],
  index: number | null,
): HTMLElement | undefined => {
  if (index === null || !iframeDocument) {
    return undefined
  }

  const block = content[index]
  if (!block || isHiddenChildrenPagesBlock(block)) {
    return undefined
  }

  const visibleIndex = content
    .slice(0, index)
    .filter((b) => !isHiddenChildrenPagesBlock(b)).length

  const contentBlocksContainer = iframeDocument.querySelector(
    "[data-isomer-content-blocks]",
  )

  return contentBlocksContainer?.children[visibleIndex] as
    | HTMLElement
    | undefined
}
