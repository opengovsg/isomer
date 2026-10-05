import { clampTableColumnWidth } from "@opengovsg/isomer-components"

export const TABLE_COLUMN_RESIZE_HIT_PX = 8

/** Trailing edge of each column, in px from the table's left. */
export const columnBoundaryLefts = (widths: number[]): number[] => {
  let cumulative = 0
  return widths.map((width) => {
    cumulative += width
    return cumulative
  })
}

/**
 * Rendered width of each column. A colspan cell does not own a single track,
 * so the width is taken from the first colspan-1 cell that starts in that column.
 */
export const measureTableColumnWidths = (
  table: HTMLTableElement,
  columnCount: number,
): number[] => {
  const widths = Array.from({ length: columnCount }, () => 0)
  const occupied = new Set<string>()

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    const row = table.rows[rowIndex]
    if (!row) continue
    let column = 0
    for (const cell of Array.from(row.cells)) {
      while (occupied.has(`${rowIndex},${column}`)) column += 1
      const colspan = cell.colSpan || 1
      const rowspan = cell.rowSpan || 1
      if (colspan === 1 && column < columnCount && widths[column] === 0) {
        widths[column] = clampTableColumnWidth(
          Math.round(cell.getBoundingClientRect().width),
        )
      }
      for (let rowOffset = 0; rowOffset < rowspan; rowOffset++) {
        for (let columnOffset = 0; columnOffset < colspan; columnOffset++) {
          occupied.add(`${rowIndex + rowOffset},${column + columnOffset}`)
        }
      }
      column += colspan
    }
  }

  const fallback = clampTableColumnWidth(
    Math.round(table.getBoundingClientRect().width / Math.max(columnCount, 1)),
  )
  return widths.map((width) => (width > 0 ? width : fallback))
}
