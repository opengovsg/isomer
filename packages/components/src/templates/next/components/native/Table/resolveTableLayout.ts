import type { TableProps } from "~/interfaces"

import { checkPhantomColumns } from "./hasPhantomColumns"

type TableRows = TableProps["content"]

export type TableLayout =
  | { kind: "auto" }
  | { kind: "fixed"; columnWidths: string[] }

/** Auto layout by default; fixed + equal `<colgroup>` widths when phantoms exist. */
export const resolveTableLayout = (rows: TableRows): TableLayout => {
  const { hasPhantomColumns, columnCount } = checkPhantomColumns(rows)
  if (!hasPhantomColumns) {
    return { kind: "auto" }
  }

  const columnWidth = `${100 / columnCount}%`

  return {
    kind: "fixed",
    columnWidths: Array.from({ length: columnCount }, () => columnWidth),
  }
}
