export const TABLE_CELL_BACKGROUND_COLOR_TOKENS = [
  "pink",
  "yellow",
  "green",
  "blue",
  "purple",
] as const

/** @deprecated No longer offered in the editor; accepted in schema for legacy content. */
export const TABLE_CELL_DEPRECATED_BRAND_BACKGROUND_COLOR_TOKEN =
  "brand.canvas.inverse" as const

export type TableCellBackgroundColorToken =
  (typeof TABLE_CELL_BACKGROUND_COLOR_TOKENS)[number]

export const TABLE_CELL_BACKGROUND_COLORS: Record<
  TableCellBackgroundColorToken,
  string
> = {
  pink: "#F7EBF1",
  yellow: "#FAF9F1",
  green: "#E9F6EC",
  blue: "#EBECF7",
  purple: "#F3EBF7",
}

export const isTableCellBackgroundColorToken = (
  value: unknown,
): value is TableCellBackgroundColorToken =>
  typeof value === "string" &&
  Object.hasOwn(TABLE_CELL_BACKGROUND_COLORS, value)

export const getTableCellBackgroundColorCss = (
  value: unknown,
): string | undefined =>
  isTableCellBackgroundColorToken(value)
    ? TABLE_CELL_BACKGROUND_COLORS[value]
    : undefined

/** CSS only when the token is allowed for header vs body. Palette tokens apply on body cells only. */
export const getTableCellBackgroundColorCssForKind = (
  value: unknown,
  { isHeader }: { isHeader: boolean },
): string | undefined => {
  if (isHeader) return undefined

  return getTableCellBackgroundColorCss(value)
}
