export const TABLE_CELL_BACKGROUND_COLOR_TOKENS = [
  "pink",
  "yellow",
  "green",
  "blue",
  "purple",
] as const

/** Resolves to site `colors.brand.canvas.inverse` via CSS var at render/build. */
export const TABLE_CELL_BRAND_BACKGROUND_COLOR_TOKEN =
  "brand.canvas.inverse" as const

type TableCellPaletteColorToken =
  (typeof TABLE_CELL_BACKGROUND_COLOR_TOKENS)[number]

export type TableCellBackgroundColorToken =
  | TableCellPaletteColorToken
  | typeof TABLE_CELL_BRAND_BACKGROUND_COLOR_TOKEN

export const TABLE_CELL_BACKGROUND_COLORS: Record<
  TableCellBackgroundColorToken,
  string
> = {
  pink: "#F7EBF1",
  yellow: "#FAF9F1",
  green: "#E9F6EC",
  blue: "#EBECF7",
  purple: "#F3EBF7",
  // Derived from the site theme CSS variable injected at build/runtime.
  "brand.canvas.inverse": "var(--color-brand-canvas-inverse)",
}

export const isTableCellBackgroundColorToken = (
  value: unknown,
): value is TableCellBackgroundColorToken =>
  typeof value === "string" &&
  Object.hasOwn(TABLE_CELL_BACKGROUND_COLORS, value)

export const isTableCellPaletteColorToken = (
  value: unknown,
): value is TableCellPaletteColorToken =>
  typeof value === "string" &&
  (TABLE_CELL_BACKGROUND_COLOR_TOKENS as readonly string[]).includes(value)

export const isTableCellBrandBackgroundColorToken = (
  value: unknown,
): value is typeof TABLE_CELL_BRAND_BACKGROUND_COLOR_TOKEN =>
  value === TABLE_CELL_BRAND_BACKGROUND_COLOR_TOKEN

export const getTableCellBackgroundColorCss = (
  value: unknown,
): string | undefined =>
  isTableCellBackgroundColorToken(value)
    ? TABLE_CELL_BACKGROUND_COLORS[value]
    : undefined
