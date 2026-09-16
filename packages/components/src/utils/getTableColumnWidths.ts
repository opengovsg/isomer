export const getEqualColumnWidths = (columnCount: number): number[] =>
  Array.from({ length: columnCount }, () => 100 / columnCount)

// Equal split when colwidths is missing, the wrong length, or has a non-number entry.
// Shared with apps/studio so both sides agree on valid colwidths.
export const resolveColumnWidths = (
  colwidths: unknown,
  columnCount: number,
): number[] => {
  if (
    !Array.isArray(colwidths) ||
    colwidths.length !== columnCount ||
    colwidths.some((width) => typeof width !== "number")
  ) {
    return getEqualColumnWidths(columnCount)
  }
  return colwidths as number[]
}
