import type { TableProps } from "~/interfaces"
import {
  columnWidthsToPxStrings,
  parseTableColumnWidths,
  tableWidthPxFromColumnWidths,
} from "~/constants/tableColumnWidth"

import { checkPhantomColumns } from "./hasPhantomColumns"

type TableRows = TableProps["content"]

export type TableLayout =
  | { kind: "auto" }
  | { kind: "fixed"; columnWidths: string[] }
  | { kind: "author"; columnWidths: string[]; tableWidth: string }

/**
 * Stored columnWidths win over phantom-column percent tracks. Tables without
 * valid author widths stay on automatic layout unless phantom columns need
 * equal percent tracks.
 */
export const resolveTableLayout = (
  rows: TableRows,
  columnWidths?: unknown,
): TableLayout => {
  const { hasPhantomColumns, columnCount } = checkPhantomColumns(rows)
  const author = parseTableColumnWidths(columnWidths, columnCount)
  if (author) {
    return {
      kind: "author",
      columnWidths: columnWidthsToPxStrings(author),
      tableWidth: tableWidthPxFromColumnWidths(author),
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
