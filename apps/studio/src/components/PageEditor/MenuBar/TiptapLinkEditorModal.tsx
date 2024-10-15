import type { Editor } from "@tiptap/react"

import { LinkEditorModal } from "../LinkEditorModal"

interface LinkEditorModalProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}
export const TiptapLinkEditorModal = ({
  editor,
  isOpen,
  onClose,
}: LinkEditorModalProps) => {
  return (
    <LinkEditorModal
      linkText={
        editor.isActive("link")
          ? editor.state.doc.nodeAt(
              Math.max(1, editor.view.state.selection.from - 1),
            )?.textContent
          : ""
      }
      linkHref={
        editor.isActive("link")
          ? String(editor.getAttributes("link").href ?? "")
          : ""
      }
      onSave={(linkText, linkHref) => {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .unsetLink()
          .deleteSelection()
          .insertContent(`<a href="${linkHref}">${linkText}</a>`)
          .run()
      }}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}
