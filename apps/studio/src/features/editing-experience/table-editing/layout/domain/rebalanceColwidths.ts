import { getEqualColumnWidths } from "@opengovsg/isomer-components"

export const rebalanceColwidths = (
  colwidths: number[] | null,
  columnCount: number,
): number[] | null => {
  if (!colwidths) {
    return null
  }

  if (colwidths.length !== columnCount) {
    return getEqualColumnWidths(columnCount)
  }

  return null
}
