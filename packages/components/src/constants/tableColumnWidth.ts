/** Author-set table column widths. Omitted, null, or invalid data means automatic layout. */
export const TABLE_COLUMN_MIN_WIDTH_PX = 60
export const TABLE_COLUMN_MAX_WIDTH_PX = 400
export const TABLE_COLUMN_DEFAULT_WIDTH_PX = 160

export const clampTableColumnWidth = (value: number): number =>
  Math.min(
    TABLE_COLUMN_MAX_WIDTH_PX,
    Math.max(TABLE_COLUMN_MIN_WIDTH_PX, Math.round(value)),
  )

/** Whole-pixel column widths in order, or null when the input is not usable. */
export const parseTableColumnWidths = (
  columnWidths: unknown,
  columnCount: number,
): number[] | null => {
  if (
    columnCount < 1 ||
    !Array.isArray(columnWidths) ||
    columnWidths.length !== columnCount
  ) {
    return null
  }

  const widths: number[] = []
  for (const value of columnWidths) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null
    widths.push(clampTableColumnWidth(value))
  }
  return widths
}

export const tableWidthPxFromColumnWidths = (widths: number[]): string =>
  `${widths.reduce((sum, width) => sum + width, 0)}px`

export const columnWidthsToPxStrings = (widths: number[]): string[] =>
  widths.map((width) => `${width}px`)
