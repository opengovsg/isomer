import type { IsomerSchema } from "@opengovsg/isomer-components"
import {
  ISOMER_PAGE_LAYOUTS,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"

import { getIsHeroFirstBlock } from "./getIsHeroFirstBlock"

// Collection, link, and search pages don't render a reorderable custom-block
// list in the editor, so the preview shouldn't offer moves either.
const NON_REORDERABLE_LAYOUTS = new Set<IsomerSchema["layout"]>([
  ISOMER_USABLE_PAGE_LAYOUTS.Collection,
  ISOMER_USABLE_PAGE_LAYOUTS.Link,
  ISOMER_PAGE_LAYOUTS.Search,
])

export interface PreviewBlockMove {
  showMoveControls: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}

const NO_MOVE: PreviewBlockMove = {
  showMoveControls: false,
  canMoveUp: false,
  canMoveDown: false,
}

export const getPreviewBlockMove = ({
  page,
  savedContent,
  index,
  isReorderBlocked,
}: {
  page: Pick<IsomerSchema, "layout" | "content">
  savedContent: readonly { type: string }[]
  index: number
  isReorderBlocked: boolean
}): PreviewBlockMove => {
  if (isReorderBlocked || NON_REORDERABLE_LAYOUTS.has(page.layout)) {
    return NO_MOVE
  }

  const { content } = page
  if (index < 0 || index >= content.length) return NO_MOVE
  // Preview and saved slots have to describe the same block. A length or type
  // mismatch means a local edit hasn't been persisted, and reordering would
  // move a different block on the server.
  if (content.length !== savedContent.length) return NO_MOVE

  const previewBlock = content[index]
  const savedBlock = savedContent[index]
  if (!previewBlock || !savedBlock || previewBlock.type !== savedBlock.type) {
    return NO_MOVE
  }

  // Homepage hero stays pinned at index 0, same as the block drawer. The hero
  // itself cannot move, and the block under it cannot move up onto it.
  const isHeroFixed = getIsHeroFirstBlock(page.layout, page)
  if (isHeroFixed && index === 0) {
    return { showMoveControls: true, canMoveUp: false, canMoveDown: false }
  }

  const minIndex = isHeroFixed ? 1 : 0
  return {
    showMoveControls: true,
    canMoveUp: index > minIndex,
    canMoveDown: index < content.length - 1,
  }
}

export const reorderBlocks = <T>(
  blocks: readonly T[],
  from: number,
  to: number,
): T[] => {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= blocks.length ||
    to >= blocks.length
  ) {
    return [...blocks]
  }

  const next = [...blocks]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return [...blocks]
  next.splice(to, 0, moved)
  return next
}

// Where `index` lands after the block at `from` is moved to `to`.
export const shiftIndexAfterMove = (
  index: number,
  from: number,
  to: number,
): number => {
  if (from === to) return index
  if (index === from) return to
  if (from < to && index > from && index <= to) return index - 1
  if (to < from && index >= to && index < from) return index + 1
  return index
}
