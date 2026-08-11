import type { Editor } from "@tiptap/react"

const focusTriggerByEditor = new WeakMap<Editor, () => boolean>()

type EditorWithTableBubbleMenuCommand = Editor["commands"] & {
  focusTableBubbleMenuTrigger: () => boolean
}

export const runTableBubbleMenuFocusTrigger = (editor: Editor): boolean =>
  focusTriggerByEditor.get(editor)?.() ?? false

// Invokes the IsomerTable command; typed wrapper until @tiptap/core augmentation.
export const focusTableBubbleMenuTrigger = (editor: Editor): boolean =>
  (
    editor.commands as EditorWithTableBubbleMenuCommand
  ).focusTableBubbleMenuTrigger()

// React registers the trigger ref; IsomerTable's focusTableBubbleMenuTrigger
// command reads it for the Tab keymap.
export const registerTableBubbleMenuFocusTrigger = (
  editor: Editor,
  focusTrigger: () => boolean,
) => {
  focusTriggerByEditor.set(editor, focusTrigger)
}

export const unregisterTableBubbleMenuFocusTrigger = (editor: Editor) => {
  focusTriggerByEditor.delete(editor)
}
