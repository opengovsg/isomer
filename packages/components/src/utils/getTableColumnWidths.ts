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

const colwidthsSumToOneHundred = (colwidths: number[]): boolean =>
  Math.abs(colwidths.reduce((sum, width) => sum + width, 0) - 100) < 1e-5

export const isUsableColwidths = ({
  colwidths,
  columnCount,
}: {
  colwidths: unknown
  columnCount: number
}): boolean =>
  Array.isArray(colwidths) &&
  colwidths.length === columnCount &&
  colwidths.every((width) => typeof width === "number") &&
  colwidthsSumToOneHundred(colwidths)

// Equal split when colwidths is missing, the wrong length, has a non-number entry,
// or does not sum to approximately 100.
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
