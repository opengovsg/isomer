export const getEqualColumnWidths = (columnCount: number): number[] =>
  Array.from({ length: columnCount }, () => 100 / columnCount)

// Falls back to an equal split whenever the stored array is missing, its
// length doesn't match the table's actual column count (e.g. right after a
// column was added/removed, before the editor's normalizer plugin has
// rewritten it), or it contains a non-number entry (e.g. a stray `null`).
// Shared between the editor (apps/studio) and the renderer (this package)
// so both sides of the `colwidths` contract agree on exactly one definition
// of "usable".
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
