import type { Editor } from "@tiptap/react"

const expandHandlers = new WeakMap<Editor, () => void>()

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
