import type { IsomerSchema } from "@opengovsg/isomer-components"
import { CONTENT_BLOCKS_SELECTOR } from "~/features/editing-experience/constants"

// packages/components' renderPageContent filters out hidden childrenpages
// blocks before rendering, so a hidden childrenpages block never reaches the
// DOM. Prose blocks are the other special case: Prose.tsx renders each
// content item (paragraph, heading, list, ...) as its own top-level DOM
// sibling instead of a single wrapper, so a prose block occupies as many
// direct DOM children as it has content items. Mirror both here so we can
// translate a `content` index into the matching DOM child index.
const getDomSpan = (block: IsomerSchema["content"][number]): number => {
  if (block.type === "childrenpages" && block.isHidden) return 0
  if (block.type === "prose") return block.content?.length ?? 0
  return 1
}

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
  if (!block || getDomSpan(block) === 0) {
    return undefined
  }

  const domIndex = content
    .slice(0, index)
    .reduce((sum, b) => sum + getDomSpan(b), 0)

  const contentBlocksContainer = iframeDocument.querySelector(
    CONTENT_BLOCKS_SELECTOR,
  )

  return contentBlocksContainer?.children[domIndex] as HTMLElement | undefined
}

// Inverse of getBlockElement: DOM child index -> `content` array index.
export const getContentIndexFromDomIndex = (
  content: IsomerSchema["content"],
  domIndex: number,
): number | null => {
  let cursor = 0
  for (let i = 0; i < content.length; i++) {
    const block = content[i]
    if (!block) continue
    const span = getDomSpan(block)
    if (domIndex < cursor + span) return i
    cursor += span
  }
  return null
}
