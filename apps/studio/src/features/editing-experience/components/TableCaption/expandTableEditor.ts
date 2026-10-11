import type { Editor } from "@tiptap/react"

const expandHandlers = new WeakMap<Editor, () => void>()
const expandedEditors = new WeakSet<Editor>()
const expandedListeners = new WeakMap<Editor, Set<() => void>>()

/** The editor surface registers this so Expand can enlarge that same editor. */
export const registerTableExpand = (editor: Editor, expand: () => void) => {
  expandHandlers.set(editor, expand)
  return () => {
    if (expandHandlers.get(editor) === expand) expandHandlers.delete(editor)
  }
}

export const expandTableEditor = (editor: Editor) => {
  expandHandlers.get(editor)?.()
}

export const setTableEditorExpanded = (editor: Editor, expanded: boolean) => {
  if (expanded) expandedEditors.add(editor)
  else expandedEditors.delete(editor)
  expandedListeners.get(editor)?.forEach((listener) => listener())
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

export const isTableEditorExpanded = (editor: Editor) =>
  expandedEditors.has(editor)
