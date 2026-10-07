export const CONTENT_BLOCK_INDEX_ATTR = "data-isomer-content-index" as const

export interface ContentBlockIndexProps {
  contentBlockIndex?: number
}

export const contentBlockIndexAttr = (
  contentBlockIndex?: number,
): Partial<Record<typeof CONTENT_BLOCK_INDEX_ATTR, number>> =>
  contentBlockIndex === undefined
    ? {}
    : { [CONTENT_BLOCK_INDEX_ATTR]: contentBlockIndex }
