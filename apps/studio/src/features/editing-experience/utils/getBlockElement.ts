/* oxlint-disable typescript/no-unnecessary-type-conversion -- core cleanup deferred */
import type { IsomerSchema } from "@opengovsg/isomer-components"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

// packages/components' renderPageContent filters out hidden childrenpages
// blocks before rendering, so a hidden childrenpages block never reaches the
// DOM and every block after it is shifted up by one. Mirror that filter here
// so we can translate a `content` index into the matching DOM child index.
const isHiddenChildrenPagesBlock = (
  block: IsomerSchema["content"][number],
  // oxlint-disable-next-line unicorn/no-unnecessary-type-conversion -- core cleanup deferred
): boolean =>
  block.type === "childrenpages" && !!isNullableBooleanTrue(block.isHidden)

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

  // SAFETY: visibleIndex counts only visible content blocks in the preview iframe
  // oxlint-disable-next-line unicorn/no-unsafe-type-assertion -- core cleanup deferred
  return contentBlocksContainer?.children[visibleIndex] as
    | HTMLElement
    | undefined
}
