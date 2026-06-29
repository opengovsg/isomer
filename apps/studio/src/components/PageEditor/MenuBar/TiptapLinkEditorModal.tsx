import type { Editor } from "@tiptap/react"
import { LINK_TYPES_MAPPING } from "~/features/editing-experience/components/LinkEditor/constants"

import { LinkEditorModal } from "../LinkEditorModal"
import { getLinkTextFromSelection } from "./getLinkText"

interface LinkEditorModalProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

const getLinkText = (editor: Editor): string =>
  getLinkTextFromSelection({
    isLinkActive: editor.isActive("link"),
    selection: editor.state.selection,
    doc: editor.state.doc,
  })

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
        const { from, to } = editor.state.selection
        const hasSelection = from !== to

        const chain = editor.chain().focus()

        // With no explicit selection we replace the entire existing link
        // (the cursor is merely placed inside it). With a selection we replace
        // exactly the highlighted range so we don't clobber the rest of a
        // partially-selected link.
        if (!hasSelection) {
          chain.extendMarkRange("link")
        }

        chain
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
