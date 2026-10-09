import type { TableProps } from "~/interfaces"
import { clampTableColumnWidth } from "~/constants/tableColumnWidth"

import { checkPhantomColumns } from "./hasPhantomColumns"

type TableRows = TableProps["content"]

export type TableLayout =
  | { kind: "auto" }
  | { kind: "fixed"; columnWidths: string[] }
  | { kind: "author"; columnWidths: string[]; tableWidth: string }

/**
 * Valid author widths, or null when the list is missing, the wrong length, or
 * contains a non-finite entry. Finite numbers are clamped to 60–400px.
 */
const authorColumnWidths = (
  columnWidths: unknown,
  columnCount: number,
): number[] | null => {
  if (
    columnCount < 1 ||
    !Array.isArray(columnWidths) ||
    columnWidths.length !== columnCount
  ) {
    return null
  }

  const widths: number[] = []
  for (const value of columnWidths) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null
    widths.push(clampTableColumnWidth(value))
  }
  return widths
}

/**
 * Author widths come first so a resized table keeps its columns even when a
 * colspan would otherwise force equal tracks. Those equal tracks exist only
 * for phantom columns, which collapse under automatic layout. Every other
 * table stays automatic so its content sizes the columns.
 */
export const resolveTableLayout = (
  rows: TableRows,
  columnWidths?: unknown,
): TableLayout => {
  const { hasPhantomColumns, columnCount } = checkPhantomColumns(rows)
  const author = authorColumnWidths(columnWidths, columnCount)
  if (author) {
    return {
      kind: "author",
      columnWidths: author.map((width) => `${width}px`),
      tableWidth: `${author.reduce((sum, width) => sum + width, 0)}px`,
    }
  }

  if (!hasPhantomColumns) {
    return { kind: "auto" }
  }

  const columnWidth = `${100 / columnCount}%`

  return {
    kind: "fixed",
    columnWidths: Array.from({ length: columnCount }, () => columnWidth),
  }
}
