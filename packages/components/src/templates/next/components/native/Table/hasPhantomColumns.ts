import type { TableProps } from "~/interfaces"

import { getTableColumnCount } from "./getTableColumnCount"
import {
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
  normalizeSpan,
} from "./tableLayoutLimits"

type TableRows = TableProps["content"]

interface CellSpan {
  colspan: number
}

/**
 * True when at least one logical column is never occupied by a `colspan={1}`
 * cell — a "phantom" track that only exists inside wider spans.
 *
 * Under `table-layout: auto` with no `<colgroup>`, browsers can collapse those
 * tracks to zero width (see `getTableColumnCount`). Callers use this to gate
 * fixed equal-width column tracks so ordinary tables keep content-based sizing.
 */
export const hasPhantomColumns = (rows: TableRows): boolean => {
  const columnCount = getTableColumnCount(rows)
  if (
    columnCount <= 1 ||
    columnCount > MAX_TABLE_COLUMNS ||
    rows.length === 0 ||
    rows.length > MAX_TABLE_ROWS
  ) {
    return false
  }

  // grid[row][col] = the cell (by colspan) covering that slot, once placed.
  const grid: (CellSpan | null)[][] = Array.from({ length: rows.length }, () =>
    Array.from({ length: columnCount }, () => null),
  )
  const hasExclusiveCell = Array.from({ length: columnCount }, () => false)

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    if (!row) {
      continue
    }

    let columnIndex = 0
    for (const cell of row.content) {
      // Slots already filled by an earlier cell's rowspan are omitted from
      // this row's JSON — skip them so we place at the next free column.
      while (columnIndex < columnCount && grid[rowIndex]?.[columnIndex]) {
        columnIndex += 1
      }
      if (columnIndex >= columnCount) {
        break
      }

      const colspan = normalizeSpan(cell.attrs?.colspan)
      const rowspan = normalizeSpan(cell.attrs?.rowspan)
      const span = { colspan }

      for (let rowOffset = 0; rowOffset < rowspan; rowOffset += 1) {
        const targetRow = rowIndex + rowOffset
        if (targetRow >= rows.length) {
          break
        }
        for (let colOffset = 0; colOffset < colspan; colOffset += 1) {
          const targetCol = columnIndex + colOffset
          if (targetCol >= columnCount) {
            break
          }
          const targetRowSlots = grid[targetRow]
          if (targetRowSlots) {
            targetRowSlots[targetCol] = span
          }
        }
      }

      if (colspan === 1) {
        hasExclusiveCell[columnIndex] = true
      }

      columnIndex += colspan
    }
  }

  return hasExclusiveCell.some((hasExclusive) => !hasExclusive)
}
