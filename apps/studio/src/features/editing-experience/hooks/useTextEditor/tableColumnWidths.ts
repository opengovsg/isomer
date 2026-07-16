// prosemirror-tables' own default minimum column width, kept as-is per the
// locked decision in rte-table-ux/issues/13-grilling-column-width-ux-details.md.
export const MIN_COLUMN_WIDTH_PX = 25

export const getEqualColumnWidths = (columnCount: number): number[] =>
  Array.from({ length: columnCount }, () => 100 / columnCount)

// `colwidths` is a table-level attribute (one entry per column, by index),
// not a per-cell one -- ProseMirror's table model has no "column" node to
// hang it on, but there's no reason to fake one out of row-0's cells either
// when the table node itself can just own the whole array directly. Falls
// back to an equal split whenever the stored array is missing, contains a
// null (not yet resized), or its length doesn't match the table's actual
// column count (e.g. right after a column was added/removed, before the
// normalizer plugin has rewritten it).
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

// A resize handle sits at the boundary right after `columnIndex`, so it only
// ever transfers width between that column and its direct neighbour -- every
// other column is untouched. This is a simple zero-sum swap between the
// pair (their combined width never changes), unlike a model that
// redistributes the delta proportionally across every other column.
export const redistributeOnResize = ({
  widths,
  columnIndex,
  deltaPercent,
  minPercent,
}: {
  widths: number[]
  columnIndex: number
  deltaPercent: number
  minPercent: number
}): number[] => {
  const neighborIndex = columnIndex + 1
  const currentWidth = widths[columnIndex] ?? 0
  const neighborWidth = widths[neighborIndex] ?? 0
  const combinedWidth = currentWidth + neighborWidth

  const targetWidth = clamp(
    currentWidth + deltaPercent,
    minPercent,
    combinedWidth - minPercent,
  )

  const result = [...widths]
  result[columnIndex] = targetWidth
  result[neighborIndex] = combinedWidth - targetWidth
  return result
}
