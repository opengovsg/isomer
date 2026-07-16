import { Plugin, PluginKey } from "@tiptap/pm/state"
import { TableMap } from "@tiptap/pm/tables"

import { getEqualColumnWidths } from "./tableColumnWidths"

const tableColumnWidthNormalizerPluginKey = new PluginKey(
  "isomerTableColumnWidthNormalizer",
)

// Whenever a column is added or removed on a table that's already been
// resized at least once, the stored `colwidths` array no longer matches the
// table's actual column count, breaking the "always sums to 100%"
// invariant. This rebalances it back to an equal split whenever that
// happens, keeping the editor's doc state and the published schema in
// agreement -- IsomerTableView's own resolveColumnWidths fallback shows the
// same equal split immediately, but only this transaction actually persists
// it. Tables that have never been resized (colwidths still null) are left
// alone; there's nothing to keep in sync yet.
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
        if (!node.firstChild) {
          return false
        }

        const colwidths = node.attrs.colwidths as number[] | null
        if (!colwidths) {
          return false
        }

        const columnCount = TableMap.get(node).width
        if (colwidths.length !== columnCount) {
          tr = tr.setNodeMarkup(pos, null, {
            ...node.attrs,
            colwidths: getEqualColumnWidths(columnCount),
          })
          changed = true
        }

        return false
      })

      return changed ? tr : null
    },
  })
