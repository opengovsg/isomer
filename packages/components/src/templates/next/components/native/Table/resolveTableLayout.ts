import type { TableProps } from "~/interfaces"

import { getTableColumnCount } from "./getTableColumnCount"
import { hasPhantomColumns } from "./hasPhantomColumns"

type TableRows = TableProps["content"]

export type TableLayout =
  | { kind: "auto" }
  | { kind: "fixed"; columnWidths: string[] }

/**
 * Chooses auto vs fixed table layout and, when fixed, derives equal-width
 * column tracks for `<colgroup>`. Only phantom-column tables need fixed layout;
 * ordinary tables keep content-based sizing.
 */
export const resolveTableLayout = (rows: TableRows): TableLayout => {
  if (!hasPhantomColumns(rows)) {
    return { kind: "auto" }
  }

  const columnCount = getTableColumnCount(rows)
  const columnWidth = `${100 / columnCount}%`

  return {
    kind: "fixed",
    columnWidths: Array.from({ length: columnCount }, () => columnWidth),
  }
}
