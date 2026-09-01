export type SelectionKind =
  | "none"
  | "single-cell"
  | "merged-cell"
  | "row"
  | "header-row"
  | "column"
  | "header-column"
  | "table"
  | "multi-cell"

export interface TableMovePlan {
  from: number
  to: number
  newStart: number
  span: number
}

export type TableMoveAxis = "row" | "column"

export interface TableBubbleMenuAnchor {
  shouldWaitForReference: () => boolean
  getReferencedVirtualElement: () => {
    getBoundingClientRect: () => DOMRect
  } | null
}
