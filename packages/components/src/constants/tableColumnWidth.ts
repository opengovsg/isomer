/** Author-set table column widths. Omitted, null, or invalid data means automatic layout. */
export const TABLE_COLUMN_MIN_WIDTH_PX = 60
export const TABLE_COLUMN_MAX_WIDTH_PX = 400
export const TABLE_COLUMN_DEFAULT_WIDTH_PX = 160

export const clampTableColumnWidth = (value: number): number =>
  Math.min(
    TABLE_COLUMN_MAX_WIDTH_PX,
    Math.max(TABLE_COLUMN_MIN_WIDTH_PX, Math.round(value)),
  )
