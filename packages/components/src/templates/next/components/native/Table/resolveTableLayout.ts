import type { TableProps } from "~/interfaces"
import { getEqualColumnWidths } from "~/utils/getTableColumnWidths"

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

  return {
    kind: "fixed",
    columnWidths: getEqualColumnWidths(columnCount).map((width) => `${width}%`),
  }
}
