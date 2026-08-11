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
  // `from` is the adjacent row/column moved past the selected block.
  from: number
  // `to` is the selected block's far edge, expressed as TipTap's move target.
  to: number
  // The selected block's first row/column after the move.
  newStart: number
  // Number of rows/columns in the selected block, used to restore selection.
  span: number
}

export type TableMoveAxis = "row" | "column"
