import type { TableProps } from "~/interfaces"

import { normalizeColspan, normalizeRowspan } from "./tableLayoutLimits"

type TableRows = TableProps["content"]

/**
 * Logical column count, accounting for `colspan` / `rowspan`.
 * Same idea as ProseMirror `TableMap.findWidth`: per-row width is cell
 * colspans plus rowspan carry; table width is the max across rows.
 *
 * Browsers with `table-layout: auto` and no `<colgroup>` can collapse phantom
 * columns (tracks that only appear inside spans) to zero width:
 *
 *   Row 1: [col1] [----cols 2-3----]
 *   Row 2: [----cols 1-2----] [col3]   (rowspan into row 3)
 *   Row 3:                    [col3]
 *
 * When `hasPhantomColumns` is true, emit N equal-width `<col>` elements under
 * `table-layout: fixed`.
 */
export const getTableColumnCount = (rows: TableRows): number => {
  if (rows.length === 0) {
    return 0
  }

  // Running max of per-row widths; -1 means "not set yet"
  let width = -1
  // Total colspan of earlier cells whose rowspan still covers the row
  // currently being processed. ProseMirror/TipTap omit those cells from the
  // covered row's own `content`, so this is credited in on their behalf.
  let activeCarry = 0
  // rowIndex -> colspan to remove from `activeCarry` once that row is reached,
  // i.e. the row where the covering cell's rowspan runs out. Keyed by row
  // instead of rescanned from history so each cell is only visited once.
  const carryExpiry = new Map<number, number>()

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const expiring = carryExpiry.get(rowIndex)
    if (expiring !== undefined) {
      activeCarry -= expiring
      carryExpiry.delete(rowIndex)
    }

    const row = rows[rowIndex]
    if (!row) {
      continue
    }

    // Carry from earlier rows' rowspans, plus this row's own cells (each may
    // span multiple columns).
    let rowWidth = activeCarry
    for (const cell of row.content) {
      const colspan = normalizeColspan(cell.attrs?.colspan)
      const rowspan = normalizeRowspan(cell.attrs?.rowspan)
      rowWidth += colspan
      if (rowspan > 1) {
        // Covers rows [rowIndex, rowIndex + rowspan); schedule carry expiry.
        activeCarry += colspan
        const expiryRow = rowIndex + rowspan
        carryExpiry.set(expiryRow, (carryExpiry.get(expiryRow) ?? 0) + colspan)
      }
    }

    // Mismatched row widths: take the max so the widest row wins.
    if (width === -1) {
      width = rowWidth
    } else if (width !== rowWidth) {
      width = Math.max(width, rowWidth)
    }
  }

  return Math.max(width, 0)
}
