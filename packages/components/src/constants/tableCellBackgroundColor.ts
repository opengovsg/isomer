export const TABLE_CELL_BACKGROUND_COLOR_TOKENS = [
  "pink",
  "yellow",
  "green",
  "blue",
  "purple",
] as const

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

export const getTableCellBackgroundColorHex = (
  value: unknown,
): string | undefined =>
  isTableCellBackgroundColorToken(value)
    ? TABLE_CELL_BACKGROUND_COLORS[value]
    : undefined
