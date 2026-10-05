export const TABLE_COLUMN_WIDTH_MIN_PX = 64
export const TABLE_COLUMN_WIDTH_MAX_PX = 600
export const TABLE_COLUMN_WIDTH_DEFAULT_PX = 160

export const clampTableColumnWidth = (value: number): number =>
  Math.round(
    Math.min(
      TABLE_COLUMN_WIDTH_MAX_PX,
      Math.max(TABLE_COLUMN_WIDTH_MIN_PX, value),
    ),
  )

/**
 * Returns clamped px widths when `columnWidths` matches `columnCount` and every
 * entry is a finite number. Otherwise null (fall back to auto / phantom layout).
 */
export const validateTableColumnWidths = (
  columnWidths: unknown,
  columnCount: number,
): number[] | null => {
  if (columnCount <= 0) return null
  if (!Array.isArray(columnWidths)) return null
  if (columnWidths.length !== columnCount) return null

  const parsed: number[] = []
  for (const entry of columnWidths) {
    if (typeof entry !== "number" || !Number.isFinite(entry)) return null
    parsed.push(clampTableColumnWidth(entry))
  }
  return parsed
}
