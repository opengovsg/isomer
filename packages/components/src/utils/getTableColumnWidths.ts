export const getEqualColumnWidths = (columnCount: number): number[] =>
  Array.from({ length: columnCount }, () => 100 / columnCount)

export interface ColgroupSpec {
  tableLayout: "fixed"
  columnWidths: string[]
}

export const buildColgroupSpec = (resolvedWidths: number[]): ColgroupSpec => ({
  tableLayout: "fixed",
  columnWidths: resolvedWidths.map((width) => `${width}%`),
})

export const isUsableColwidths = ({
  colwidths,
  columnCount,
}: {
  colwidths: unknown
  columnCount: number
}): boolean =>
  Array.isArray(colwidths) &&
  colwidths.length === columnCount &&
  colwidths.every((width) => typeof width === "number")

// Equal split when colwidths is missing, the wrong length, or has a non-number entry.
// Shared with apps/studio so both sides agree on valid colwidths.
export const resolveColumnWidths = (
  colwidths: unknown,
  columnCount: number,
): number[] => {
  if (!isUsableColwidths({ colwidths, columnCount })) {
    return getEqualColumnWidths(columnCount)
  }
  return colwidths as number[]
}
