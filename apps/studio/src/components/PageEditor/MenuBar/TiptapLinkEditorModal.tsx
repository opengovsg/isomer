import type { Editor } from "@tiptap/react"

import { LINK_TYPES_MAPPING } from "~/features/editing-experience/components/LinkEditor/constants"
import { LinkEditorModal } from "../LinkEditorModal"

interface LinkEditorModalProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

const getLinkText = (editor: Editor): string => {
  if (editor.isActive("link")) {
    return (
      editor.state.doc.nodeAt(Math.max(1, editor.view.state.selection.from - 1))
        ?.textContent ?? ""
    )
  }

  const { from, to } = editor.state.selection
  const selectedText: string = editor.state.doc.textBetween(from, to, " ")
  return selectedText
}

const getLinkHref = (editor: Editor): string => {
  if (editor.isActive("link")) {
    return String(editor.getAttributes("link").href ?? "")
  }

  return ""
}

export const TiptapLinkEditorModal = ({
  editor,
  isOpen,
  onClose,
}: LinkEditorModalProps) => {
  return (
    <LinkEditorModal
      linkTypes={LINK_TYPES_MAPPING}
      linkText={getLinkText(editor)}
      linkHref={getLinkHref(editor)}
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
