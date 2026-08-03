import type { TableProps } from "~/interfaces"

import { checkPhantomColumns } from "./hasPhantomColumns"

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
