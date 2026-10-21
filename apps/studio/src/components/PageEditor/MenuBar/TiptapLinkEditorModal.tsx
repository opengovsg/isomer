import type { Editor } from "@tiptap/react"
import { getMarkRange } from "@tiptap/react"
import { LINK_TYPES_MAPPING } from "~/features/editing-experience/components/LinkEditor/constants"

import { LinkEditorModal } from "../LinkEditorModal"

interface LinkEditorModalProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

export const getLinkText = (editor: Editor): string => {
  const linkType = editor.schema.marks.link
  if (linkType && editor.isActive("link")) {
    const { doc, selection } = editor.state
    const range = getMarkRange(doc.resolve(selection.from), linkType)
    return range ? doc.textBetween(range.from, range.to) : ""
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
      onRemove={() => {
        editor.chain().focus().extendMarkRange("link").unsetLink().run()
      }}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}
