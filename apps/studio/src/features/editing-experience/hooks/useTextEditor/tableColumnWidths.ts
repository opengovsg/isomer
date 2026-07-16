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

// Fixes up floating-point drift so the "always sums to exactly 100" invariant
// holds, by absorbing the residual into the single largest column.
const normalizeToTotal = (widths: number[]): number[] => {
  const total = widths.reduce((sum, width) => sum + width, 0)
  const drift = 100 - total
  const largestIndex = widths.indexOf(Math.max(...widths))
  return widths.map((width, index) =>
    index === largestIndex ? width + drift : width,
  )
}

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
  const otherIndices = widths
    .map((_, index) => index)
    .filter((index) => index !== columnIndex)

  const currentWidth = widths[columnIndex] ?? 0
  const maxWidth = 100 - minPercent * otherIndices.length
  const targetWidth = clamp(currentWidth + deltaPercent, minPercent, maxWidth)
  const delta = targetWidth - currentWidth

  const result = [...widths]
  result[columnIndex] = targetWidth

  const sumOthers = otherIndices.reduce(
    (sum, index) => sum + (widths[index] ?? 0),
    0,
  )
  if (sumOthers <= 0) {
    return normalizeToTotal(result)
  }

  // Shrink/grow every other column proportional to its current share of the
  // combined "other columns" width.
  otherIndices.forEach((index) => {
    const width = widths[index] ?? 0
    result[index] = width - delta * (width / sumOthers)
  })

  // Any column pushed below the floor gets clamped there; its shortfall is
  // redistributed proportionally among the columns that still have room.
  // (Single pass: a column clamped here cascading a second column below the
  // floor is a pathologically narrow-table/many-columns case, not handled.)
  const belowFloor = otherIndices.filter(
    (index) => (result[index] ?? 0) < minPercent,
  )
  if (belowFloor.length > 0 && belowFloor.length < otherIndices.length) {
    const shortfall = belowFloor.reduce(
      (sum, index) => sum + (minPercent - (result[index] ?? 0)),
      0,
    )
    belowFloor.forEach((index) => {
      result[index] = minPercent
    })
    const stillFlexible = otherIndices.filter(
      (index) => !belowFloor.includes(index),
    )
    const sumFlexible = stillFlexible.reduce(
      (sum, index) => sum + (result[index] ?? 0),
      0,
    )
    if (sumFlexible > 0) {
      stillFlexible.forEach((index) => {
        const width = result[index] ?? 0
        result[index] = width - shortfall * (width / sumFlexible)
      })
    }
  }

  return normalizeToTotal(result)
}
