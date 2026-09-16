import type { TableProps } from "~/interfaces"
import {
  buildColgroupSpec,
  isUsableColwidths,
  resolveColumnWidths,
} from "~/utils/getTableColumnWidths"

import { resolveTableLayout } from "./resolveTableLayout"

type TableRows = TableProps["content"]

export type PublishedTableLayout =
  | { kind: "auto" }
  | { kind: "fixed"; columnWidths: string[] }

export const resolvePublishedTableLayout = ({
  colwidths,
  rows,
  columnCount,
}: {
  colwidths: unknown
  rows: TableRows
  columnCount: number
}): PublishedTableLayout => {
  if (isUsableColwidths({ colwidths, columnCount })) {
    return {
      kind: "fixed",
      columnWidths: buildColgroupSpec(
        resolveColumnWidths(colwidths, columnCount),
      ).columnWidths,
    }
  }

  return resolveTableLayout(rows)
}
