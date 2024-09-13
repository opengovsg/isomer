import type { Editor } from "@tiptap/react"
import { useDisclosure } from "@chakra-ui/react"

import { LinkEditorModal } from "~/components/PageEditor/LinkEditorModal"

interface UseLinkEditorModalProps {
  editor: Editor
}

export const useLinkEditorModal = ({ editor }: UseLinkEditorModalProps) => {
  const {
    isOpen: isLinkModalOpen,
    onOpen: onLinkModalOpen,
    onClose: onLinkModalClose,
  } = useDisclosure()

  return {
    onLinkModalOpen,
    LinkEditorModal: (
      <LinkEditorModal
        linkText={
          editor.isActive("link")
            ? editor.state.doc.nodeAt(
                Math.max(1, editor.view.state.selection.from - 1),
              )?.textContent
            : ""
        }
        linkHref={
          editor.isActive("link") ? editor.getAttributes("link").href : ""
        }
        onSave={(linkText, linkHref) => {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .deleteSelection()
            .insertContent(`<a href="${linkHref}">${linkText}</a>`)
            .run()

          onLinkModalClose()
        }}
        onClose={onLinkModalClose}
        isOpen={isLinkModalOpen}
      />
    ),
  }
}
