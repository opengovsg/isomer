import type { Editor } from "@tiptap/react"

const focusTriggerByEditor = new WeakMap<Editor, () => boolean>()

export const runTableBubbleMenuFocusTrigger = (editor: Editor): boolean =>
  focusTriggerByEditor.get(editor)?.() ?? false

export const registerTableBubbleMenuFocusTrigger = (
  editor: Editor,
  focusTrigger: () => boolean,
) => {
  focusTriggerByEditor.set(editor, focusTrigger)
}

export const unregisterTableBubbleMenuFocusTrigger = (editor: Editor) => {
  focusTriggerByEditor.delete(editor)
}
