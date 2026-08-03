import type { TableProps } from "~/interfaces"

import {
  MAX_TABLE_ROWS,
  normalizeColspan,
  normalizeRowspan,
} from "./tableLayoutLimits"

type TableRows = TableProps["content"]

/**
 * Logical column count for a table, accounting for `colspan` / `rowspan`.
 *
 * Mirrors ProseMirror's `TableMap` / `findWidth` algorithm:
 * - Each row's width = sum of that row's cell colspans
 *   + columns still covered by earlier cells whose rowspan reaches this row
 * - The table's column count = max of those per-row widths
 *
 * Why this exists: browsers with `table-layout: auto` and no `<colgroup>` can
 * collapse "phantom" columns — tracks that only ever appear inside spans — to
 * zero width. Example (logically 3 columns, but col 2 has no exclusive cell):
 *
 *   Row 1: [col1] [----cols 2–3----]
 *   Row 2: [----cols 1–2----] [col3]   (rowspan into row 3)
 *   Row 3:                    [col3]
 *
 * When `hasPhantomColumns` is true, the renderer uses this count to emit N
 * equal-width `<col>` elements under `table-layout: fixed` so every logical
 * track keeps a non-zero share of the table width.
 */
export const getTableColumnCount = (rows: TableRows): number => {
  if (rows.length === 0) {
    return 0
  }

  // Running max of per-row widths; -1 means "not set yet"
  let width = -1
  // Once any cell has rowspan > 1, later rows must credit columns still covered
  // by that cell (those columns are omitted from the later row's `content`).
  let hasRowSpan = false

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    if (!row) {
      continue
    }

    let rowWidth = 0

    // Credit columns occupied by earlier cells whose rowspan still covers
    // this row. ProseMirror/TipTap omit those cells from `row.content`.
    // Example: a cell at row 0 with rowspan 2 covers a slot in row 1 even
    // though row 1's JSON has no entry for that column.
    if (hasRowSpan) {
      // Rowspan is capped at MAX_TABLE_ROWS, so only rows in this window
      // can still cover `rowIndex`.
      const earliestCoveringRow = Math.max(0, rowIndex - MAX_TABLE_ROWS)
      for (let earlier = earliestCoveringRow; earlier < rowIndex; earlier++) {
        const earlierRow = rows[earlier]
        if (!earlierRow) {
          continue
        }
        for (const cell of earlierRow.content) {
          const rowspan = normalizeRowspan(cell.attrs?.rowspan)
          const colspan = normalizeColspan(cell.attrs?.colspan)
          // Cell started at `earlier` and extends `rowspan` rows → covers
          // indices [earlier, earlier + rowspan). Include it if this row
          // falls in that half-open range.
          if (earlier + rowspan > rowIndex) {
            rowWidth += colspan
          }
        }
      }
    }

    // Add this row's own cells (each may span multiple columns).
    for (const cell of row.content) {
      const colspan = normalizeColspan(cell.attrs?.colspan)
      const rowspan = normalizeRowspan(cell.attrs?.rowspan)
      rowWidth += colspan
      if (rowspan > 1) {
        hasRowSpan = true
      }
    }

    // Irregular tables (mismatched row widths) take the max so we never
    // under-count columns needed by the widest row.
    if (width === -1) {
      width = rowWidth
    } else if (width !== rowWidth) {
      width = Math.max(width, rowWidth)
    }
  }

  return Math.max(width, 0)
}
