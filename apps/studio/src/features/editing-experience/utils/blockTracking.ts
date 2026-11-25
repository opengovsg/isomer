import type { BlockAddSource } from "~/types/editorDrawer"
import { captureSiteEvent } from "~/lib/posthogCapture"

interface Block {
  type: string
}

export const getBlockAddedProperties = ({
  source,
  index,
  blocks,
}: {
  source: BlockAddSource
  index: number
  blocks: readonly Block[]
}) => ({
  source,
  block_type: blocks[index]?.type,
  position: index + 1,
  block_count: blocks.length,
})

// Fires on save, not on pick: a picked block that is then discarded or
// deleted never reaches the page, so it isn't counted as added.
export const captureBlockAdded = (
  siteId: number | string,
  added: {
    source: BlockAddSource | null
    index: number | null
    blocks: readonly Block[]
  },
) => {
  const { source, index, blocks } = added
  if (source === null || index === null) return
  captureSiteEvent(
    "block_added",
    siteId,
    getBlockAddedProperties({ source, index, blocks }),
  )
}

// Positions are 1-based so they read the same as "position 3" in the
// editor's block list. block_count lets analysis tell "moved to the end"
// apart from "moved to the middle".
export const getBlockReorderedProperties = ({
  from,
  to,
  blocks,
}: {
  from: number
  to: number
  blocks: readonly Block[]
}) => ({
  block_type: blocks[from]?.type,
  from_position: from + 1,
  to_position: to + 1,
  block_count: blocks.length,
})

export const captureBlockReordered = (
  siteId: number | string,
  move: { from: number; to: number; blocks: readonly Block[] },
) => {
  // A drop back onto the same slot is not a reorder
  if (move.from === move.to) return
  captureSiteEvent("block_reordered", siteId, getBlockReorderedProperties(move))
}
