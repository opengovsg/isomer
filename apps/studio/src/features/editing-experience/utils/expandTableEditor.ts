import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/react"
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state"

const expandedTablePluginKey = new PluginKey<number | null>("expandedTable")

/** Set on the expanded table's node-view root, a direct child of `.ProseMirror`. */
export const EXPANDED_TABLE_ATTR = "data-expanded-table"
/** Set on `.ProseMirror` while one table is expanded, so siblings can be hidden. */
export const ISOLATE_EXPANDED_TABLE_ATTR = "data-isolate-expanded-table"

const tableAt = (
  doc: ProseMirrorNode,
  tablePos: number,
): ProseMirrorNode | null => {
  const node = doc.nodeAt(tablePos)
  if (!node || node.type.name !== "table") return null
  return node
}

const firstTextblockPos = (
  doc: ProseMirrorNode,
  tablePos: number,
  tableEnd: number,
): number | null => {
  let textPos: number | null = null
  doc.nodesBetween(tablePos, tableEnd, (node, pos) => {
    if (textPos !== null) return false
    if (node.isTextblock) {
      textPos = pos + 1
      return false
    }
    return true
  })
  return textPos
}

/**
 * A change is inside the table when its old range sits within the table node.
 * A zero-width insert on either boundary is a sibling of the table, not an edit
 * of it.
 */
const changeStaysInsideTable = (
  oldStart: number,
  oldEnd: number,
  tablePos: number,
  tableEnd: number,
) => {
  if (oldStart === oldEnd) {
    return oldStart > tablePos && oldStart < tableEnd
  }
  return oldStart >= tablePos && oldEnd <= tableEnd
}

const transactionStaysInsideTable = (
  tr: Transaction,
  tablePos: number,
  tableNodeSize: number,
) => {
  let from = tablePos
  let to = tablePos + tableNodeSize
  for (const step of tr.steps) {
    let outside = false
    const map = step.getMap()
    map.forEach((oldStart, oldEnd) => {
      if (!changeStaysInsideTable(oldStart, oldEnd, from, to)) outside = true
    })
    if (outside) return false
    from = map.map(from, -1)
    to = map.map(to, 1)
  }
  return true
}

const clearExpandedTableDom = (root: HTMLElement) => {
  root.querySelectorAll(`[${EXPANDED_TABLE_ATTR}]`).forEach((element) => {
    element.removeAttribute(EXPANDED_TABLE_ATTR)
  })
  root.removeAttribute(ISOLATE_EXPANDED_TABLE_ATTR)
}

const markExpandedTable = (view: EditorView) => {
  const root = view.dom
  if (!(root instanceof HTMLElement)) return
  clearExpandedTableDom(root)

  const tablePos = expandedTablePluginKey.getState(view.state)
  if (typeof tablePos !== "number") return

  // nodeDOM is the direct child of `.ProseMirror`. The React tree inside it is not.
  const tableDom = view.nodeDOM(tablePos)
  if (tableDom instanceof HTMLElement) {
    tableDom.setAttribute(EXPANDED_TABLE_ATTR, "")
  }
  root.setAttribute(ISOLATE_EXPANDED_TABLE_ATTR, "")
}

export const expandedTablePlugin = () =>
  new Plugin<number | null>({
    key: expandedTablePluginKey,
    state: {
      init: () => null,
      apply(tr, value) {
        const meta = tr.getMeta(expandedTablePluginKey) as
          | number
          | null
          | undefined
        if (meta === null) return null
        if (typeof meta === "number") return meta
        if (value == null) return null
        const mapped = tr.mapping.map(value, 1)
        return tableAt(tr.doc, mapped) ? mapped : null
      },
    },
    filterTransaction(tr, state) {
      if (!tr.docChanged) return true
      const tablePos = expandedTablePluginKey.getState(state)
      if (tablePos == null) return true
      const table = tableAt(state.doc, tablePos)
      if (!table) return true
      return transactionStaysInsideTable(tr, tablePos, table.nodeSize)
    },
    appendTransaction(_transactions, _oldState, newState) {
      const tablePos = expandedTablePluginKey.getState(newState)
      if (tablePos == null) return null
      const table = tableAt(newState.doc, tablePos)
      if (!table) return null
      const tableEnd = tablePos + table.nodeSize
      const { from, to } = newState.selection
      if (from >= tablePos && to <= tableEnd) return null
      const textPos = firstTextblockPos(newState.doc, tablePos, tableEnd)
      if (textPos == null) return null
      return newState.tr.setSelection(
        TextSelection.create(newState.doc, textPos),
      )
    },
    view(editorView) {
      return {
        update(view) {
          markExpandedTable(view)
        },
        destroy() {
          const root = editorView.dom
          if (root instanceof HTMLElement) clearExpandedTableDom(root)
        },
      }
    },
  })

export const setTableEditorExpanded = (
  editor: Editor,
  tablePos: number | null,
) => {
  if (editor.isDestroyed) return
  editor.view.dispatch(
    editor.state.tr
      .setMeta(expandedTablePluginKey, tablePos)
      .setMeta("addToHistory", false),
  )
}

export const subscribeTableEditorExpanded = (
  editor: Editor,
  listener: () => void,
) => {
  editor.on("transaction", listener)
  return () => {
    editor.off("transaction", listener)
  }
}

export const getExpandedTablePos = (editor: Editor): number | null => {
  const pos = expandedTablePluginKey.getState(editor.state)
  return typeof pos === "number" ? pos : null
}
