import { Plugin } from "@tiptap/pm/state"

import { getColumnCount } from "../domain/columnCount"
import { rebalanceColwidths } from "../domain/rebalanceColwidths"

// Rebalance colwidths to equal splits when column count changes. Skip tables with colwidths: null.
export const tableColumnWidthNormalizerPlugin = () =>
  new Plugin({
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
        const rebalanced = rebalanceColwidths(colwidths, getColumnCount(node))
        if (rebalanced) {
          tr = tr.setNodeMarkup(pos, null, {
            ...node.attrs,
            colwidths: rebalanced,
          })
          changed = true
        }

        return false
      })

      return changed ? tr : null
    },
  })
