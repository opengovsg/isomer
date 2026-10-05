import type { TableProps } from "~/interfaces"
import { validateTableColumnWidths } from "~/constants/tableColumnWidths"

import { getTableColumnCount } from "./getTableColumnCount"
import { checkPhantomColumns } from "./hasPhantomColumns"

type TableRows = TableProps["content"]

export type TableLayout =
  | { kind: "auto" }
  | {
      kind: "fixed"
      columnWidths: string[]
      tableWidthPx: number
    }

/** Auto layout by default; author widths or equal phantom `<colgroup>` when needed. */
export const resolveTableLayout = (
  rows: TableRows,
  storedColumnWidths?: TableProps["attrs"]["columnWidths"],
): TableLayout => {
  const columnCount = getTableColumnCount(rows)
  const authorWidths = validateTableColumnWidths(
    storedColumnWidths,
    columnCount,
  )
  if (authorWidths) {
    return {
      kind: "fixed",
      columnWidths: authorWidths.map((width) => `${width}px`),
      tableWidthPx: authorWidths.reduce((sum, width) => sum + width, 0),
    }
  }

  const { hasPhantomColumns, columnCount: phantomColumnCount } =
    checkPhantomColumns(rows)
  if (!hasPhantomColumns) {
    return { kind: "auto" }
  }

  const columnWidth = `${100 / phantomColumnCount}%`

  return {
    kind: "fixed",
    columnWidths: Array.from({ length: phantomColumnCount }, () => columnWidth),
    tableWidthPx: 0,
  }
}
