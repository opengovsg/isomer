import type { TableProps } from "~/interfaces"

type TableRows = TableProps["content"]

/**
 * Logical column count for a table, accounting for `colspan` / `rowspan`.
 *
 * Mirrors ProseMirror's `TableMap` width algorithm: each row's width is the
 * sum of its cells' colspans plus any columns covered by rowspans from
 * earlier rows. The table width is the max of those row widths.
 *
 * Used to emit a `<colgroup>` so browsers don't collapse "phantom" columns
 * that only ever appear inside spans (e.g. row1 merges cols 2–3 while row2
 * merges cols 1–2 — logically 3 columns, but auto layout may drop the
 * middle track to zero width).
 */
export const getTableColumnCount = (rows: TableRows): number => {
  if (rows.length === 0) {
    return 0
  }

  let width = -1
  let hasRowSpan = false

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    if (!row) {
      continue
    }

    let rowWidth = 0

    // Columns occupied by cells from earlier rows that still rowspan into this row
    if (hasRowSpan) {
      for (let earlier = 0; earlier < rowIndex; earlier++) {
        const earlierRow = rows[earlier]
        if (!earlierRow) {
          continue
        }
        for (const cell of earlierRow.content) {
          const rowspan = cell.attrs?.rowspan ?? 1
          const colspan = cell.attrs?.colspan ?? 1
          if (earlier + rowspan > rowIndex) {
            rowWidth += colspan
          }
        }
      }
    }

    for (const cell of row.content) {
      const colspan = cell.attrs?.colspan ?? 1
      const rowspan = cell.attrs?.rowspan ?? 1
      rowWidth += colspan
      if (rowspan > 1) {
        hasRowSpan = true
      }
    }

    if (width === -1) {
      width = rowWidth
    } else if (width !== rowWidth) {
      width = Math.max(width, rowWidth)
    }
  }

  return Math.max(width, 0)
}
