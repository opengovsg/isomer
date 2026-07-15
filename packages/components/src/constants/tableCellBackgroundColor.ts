export type TableCellBackgroundColorToken =
  | "grey"
  | "blue"
  | "purple"
  | "red"
  | "green"

export const TABLE_CELL_BACKGROUND_COLOR_TOKENS = [
  "grey",
  "blue",
  "purple",
  "red",
  "green",
] as const satisfies readonly TableCellBackgroundColorToken[]

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
