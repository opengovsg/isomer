import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"

import { getEqualColumnWidths } from "./tableColumnWidths"

const tableColumnWidthNormalizerPluginKey = new PluginKey(
  "isomerTableColumnWidthNormalizer",
)

interface RowCell {
  colspan: number
  colwidth: number | null
}

const getRowCells = (row: ProseMirrorNode): RowCell[] => {
  const cells: RowCell[] = []
  row.forEach((cell) => {
    cells.push({
      colspan: cell.attrs.colspan as number,
      colwidth: cell.attrs.colwidth as number | null,
    })
  })
  return cells
}

// Whenever a column is added or removed (via any command that changes the
// first row's cell count), the new/shifted cells won't have a colwidth yet,
// breaking the "always sums to 100%" invariant. This rebalances the whole
// row back to an equal split whenever that happens, keeping the editor's
// doc state and the published schema in agreement -- IsomerTableView's own
// getColumnWidthsFromRow fallback shows the same equal split immediately,
// but only this transaction actually persists it.
export const tableColumnWidthNormalizerPlugin = () =>
  new Plugin({
    key: tableColumnWidthNormalizerPluginKey,
    appendTransaction(transactions, _oldState, newState) {
      if (!transactions.some((transaction) => transaction.docChanged)) {
        return null
      }

      let tr = newState.tr
      let changed = false

      newState.doc.descendants((node, pos) => {
        if (node.type.name !== "table") {
          return true
        }

        const row = node.firstChild
        if (!row) {
          return false
        }

        const cells = getRowCells(row)
        const isSimpleRow = cells.every((cell) => cell.colspan === 1)
        const hasSomeWidths = cells.some((cell) => cell.colwidth != null)
        const hasAllWidths = cells.every((cell) => cell.colwidth != null)

        if (isSimpleRow && hasSomeWidths && !hasAllWidths) {
          const widths = getEqualColumnWidths(cells.length)
          let cellPos = pos + 2
          row.forEach((cell, _offset, index) => {
            tr = tr.setNodeMarkup(cellPos, null, {
              ...cell.attrs,
              colwidth: widths[index] ?? null,
            })
            cellPos += cell.nodeSize
          })
          changed = true
        }

        return false
      })

      return changed ? tr : null
    },
  })
