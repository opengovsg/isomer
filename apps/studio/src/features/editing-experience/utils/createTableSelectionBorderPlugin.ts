import type { EditorState } from "@tiptap/pm/state"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { CellSelection, selectedRect } from "@tiptap/pm/tables"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

import { getSelectedCellBorderClasses } from "./getSelectedCellBorderClasses"

export const tableSelectionBorderPluginKey = new PluginKey(
  "tableSelectionBorder",
)

/**
 * Draws a single outer primary border around a CellSelection by tagging only
 * the selection's perimeter cells with side-specific classes (merged with the
 * built-in `selectedCell` fill decoration).
 */
export const createTableSelectionBorderPlugin = () =>
  new Plugin({
    key: tableSelectionBorderPluginKey,
    props: {
      decorations(state: EditorState) {
        if (!(state.selection instanceof CellSelection)) {
          return DecorationSet.empty
        }

        const rect = selectedRect(state)
        const decorations: Decoration[] = []

        state.selection.forEachCell((node, pos) => {
          const cellRect = rect.map.findCell(pos - rect.tableStart)
          const classes = getSelectedCellBorderClasses(rect, cellRect)
          if (classes.length === 0) return

          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: classes.join(" "),
            }),
          )
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
