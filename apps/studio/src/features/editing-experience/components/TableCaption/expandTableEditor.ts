import type { Editor } from "@tiptap/react"

const expandHandlers = new WeakMap<Editor, (tablePos: number) => void>()
const expandedTablePositions = new WeakMap<Editor, number>()
const expandedListeners = new WeakMap<Editor, Set<() => void>>()

/** Set on the expanded table's node-view root, a direct child of `.ProseMirror`. */
export const EXPANDED_TABLE_ATTR = "data-expanded-table"
/** Set on `.ProseMirror` while one table is expanded, so siblings can be hidden. */
export const ISOLATE_EXPANDED_TABLE_ATTR = "data-isolate-expanded-table"

/** The editor surface registers this so Expand can enlarge that same editor. */
export const registerTableExpand = (
  editor: Editor,
  expand: (tablePos: number) => void,
) => {
  expandHandlers.set(editor, expand)
  return () => {
    if (expandHandlers.get(editor) === expand) expandHandlers.delete(editor)
  }
}

export const expandTableEditor = (editor: Editor, tablePos: number) => {
  expandHandlers.get(editor)?.(tablePos)
}

const notifyExpandedListeners = (editor: Editor) => {
  expandedListeners.get(editor)?.forEach((listener) => listener())
}

export const setTableEditorExpanded = (
  editor: Editor,
  tablePos: number | null,
) => {
  if (tablePos === null) expandedTablePositions.delete(editor)
  else expandedTablePositions.set(editor, tablePos)
  notifyExpandedListeners(editor)
}

export const subscribeTableEditorExpanded = (
  editor: Editor,
  listener: () => void,
) => {
  const listeners = expandedListeners.get(editor) ?? new Set()
  listeners.add(listener)
  expandedListeners.set(editor, listeners)
  return () => {
    listeners.delete(listener)
  }
}

export const getExpandedTablePos = (editor: Editor): number | null =>
  expandedTablePositions.get(editor) ?? null

export const isTableEditorExpanded = (editor: Editor) =>
  expandedTablePositions.has(editor)

/**
 * Marks the expanded table and turns on sibling hiding. The attribute has to
 * live on `nodeDOM`, which is the direct child of `.ProseMirror` — the React
 * wrapper inside it is not.
 */
export const syncExpandedTableDom = (
  editor: Editor,
  tablePos: number | null,
) => {
  if (editor.isDestroyed) return
  const root = editor.view.dom
  if (!(root instanceof HTMLElement)) return

  root.querySelectorAll(`[${EXPANDED_TABLE_ATTR}]`).forEach((element) => {
    element.removeAttribute(EXPANDED_TABLE_ATTR)
  })

  if (tablePos === null) {
    root.removeAttribute(ISOLATE_EXPANDED_TABLE_ATTR)
    return
  }

  const tableDom = editor.view.nodeDOM(tablePos)
  if (tableDom instanceof HTMLElement) {
    tableDom.setAttribute(EXPANDED_TABLE_ATTR, "")
  }
  root.setAttribute(ISOLATE_EXPANDED_TABLE_ATTR, "")
}

/** Keep the caret in the table on screen so chrome does not follow a hidden one. */
export const placeSelectionInExpandedTable = (
  editor: Editor,
  tablePos: number,
) => {
  if (editor.isDestroyed) return
  const table = editor.state.doc.nodeAt(tablePos)
  if (!table || table.type.name !== "table") return

  const { from } = editor.state.selection
  if (from >= tablePos && from < tablePos + table.nodeSize) return

  let textPos: number | undefined
  editor.state.doc.nodesBetween(
    tablePos,
    tablePos + table.nodeSize,
    (node, pos) => {
      if (textPos !== undefined) return false
      if (node.isTextblock) {
        textPos = pos + 1
        return false
      }
      return true
    },
  )
  if (textPos === undefined) return
  editor.commands.setTextSelection(textPos)
}
