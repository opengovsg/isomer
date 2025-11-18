export const CHILDREN_PAGES_LAYOUT_OPTIONS = {
  Boxes: "boxes",
  Rows: "rows",
} as const

export const DEFAULT_CHILDREN_PAGES_BLOCK = {
  type: "childrenpages" as const,
  variant: CHILDREN_PAGES_LAYOUT_OPTIONS.Rows,
  showSummary: true,
  showThumbnail: false,
  childrenPagesOrdering: [] as string[],
}
