import type { EditorState } from "@tiptap/pm/state"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { CellSelection, selectedRect } from "@tiptap/pm/tables"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

import { getSelectedCellBorderClasses } from "./getSelectedCellBorderClasses"
import { shouldDimUnselectedTableCells } from "./shouldDimUnselectedTableCells"

export const tableSelectionBorderPluginKey = new PluginKey(
  "tableSelectionBorder",
)

/**
 * Draws a single outer primary border around a CellSelection by tagging only
 * the selection's perimeter cells with side-specific classes (merged with the
 * built-in `selectedCell` fill decoration). For row/column and multi-cell
 * selections, also dims text in cells outside the selection.
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

        if (shouldDimUnselectedTableCells(rect)) {
          const selectedPositions = new Set<number>()
          state.selection.forEachCell((_node, pos) => {
            selectedPositions.add(pos)
          })

          const processedPositions = new Set<number>()
          const { map, tableStart } = rect

          for (let row = 0; row < map.height; row++) {
            for (let col = 0; col < map.width; col++) {
              const cellPos = map.map[row * map.width + col]
              if (cellPos === undefined) continue

              const docPos = tableStart + cellPos
              if (processedPositions.has(docPos)) continue
              processedPositions.add(docPos)

              if (selectedPositions.has(docPos)) continue

              const node = state.doc.nodeAt(docPos)
              if (!node) continue

              decorations.push(
                Decoration.node(docPos, docPos + node.nodeSize, {
                  class: "dimmedCell",
                }),
              )
            }
          }
        }

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
