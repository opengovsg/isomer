import { Plugin, PluginKey } from "@tiptap/pm/state"

import { getColumnCount, getEqualColumnWidths } from "./tableColumnWidths"

const tableColumnWidthNormalizerPluginKey = new PluginKey(
  "isomerTableColumnWidthNormalizer",
)

// After a column add/remove, colwidths may be the wrong length. Rebalance to an
// equal split. Skip tables that still have colwidths: null.
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

        const colwidths = node.attrs.colwidths as number[] | null
        if (!colwidths) {
          return false
        }

        const columnCount = getColumnCount(node)
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
