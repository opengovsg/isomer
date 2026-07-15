export const TABLE_CELL_BACKGROUND_COLOR_TOKENS = [
  "grey",
  "blue",
  "purple",
  "red",
  "green",
] as const

export type TableCellBackgroundColorToken =
  (typeof TABLE_CELL_BACKGROUND_COLOR_TOKENS)[number]

export const TABLE_CELL_BACKGROUND_COLORS: Record<
  TableCellBackgroundColorToken,
  string
> = {
  grey: "#F8F9F9",
  blue: "#E6EFFE",
  purple: "#EFE7FF",
  red: "#FBE9E9",
  green: "#E2EEED",
}

export const isTableCellBackgroundColorToken = (
  value: unknown,
): value is TableCellBackgroundColorToken =>
  typeof value === "string" && value in TABLE_CELL_BACKGROUND_COLORS

export const getTableCellBackgroundColorHex = (
  value: unknown,
): string | undefined =>
  isTableCellBackgroundColorToken(value)
    ? TABLE_CELL_BACKGROUND_COLORS[value]
    : undefined
