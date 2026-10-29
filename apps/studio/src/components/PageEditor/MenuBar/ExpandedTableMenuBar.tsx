import type { Editor } from "@tiptap/react"
import type { ComponentType } from "react"
import { useDisclosure } from "@chakra-ui/react"
import { lazy, Suspense, useMemo } from "react"
import {
  BiBold,
  BiItalic,
  BiLink,
  BiListOl,
  BiListUl,
  BiStrikethrough,
  BiUnderline,
} from "react-icons/bi"
import { MdSubscript, MdSuperscript } from "react-icons/md"

import type { PossibleMenubarItemProps } from "./MenubarItem/types"
import { MenuBar } from "./MenuBar"

interface LinkModalProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

// Loaded on open. A static import pulls next/router, which browser tests cannot run.
const TiptapLinkEditorModal = lazy(() =>
  import("./TiptapLinkEditorModal").then((module) => ({
    default: module.TiptapLinkEditorModal as ComponentType<LinkModalProps>,
  })),
)

/** Formatting actions for the expanded table. Page inserts and table deletion stay out. */
export const ExpandedTableMenuBar = ({ editor }: { editor: Editor }) => {
  const {
    isOpen: isLinkModalOpen,
    onOpen: onLinkModalOpen,
    onClose: onLinkModalClose,
  } = useDisclosure()

  const items: PossibleMenubarItemProps[] = useMemo(
    () => [
      {
        type: "item",
        icon: BiBold,
        title: "Bold",
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive("bold"),
      },
      {
        type: "item",
        icon: BiItalic,
        title: "Italicise",
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive("italic"),
      },
      {
        type: "item",
        icon: BiUnderline,
        title: "Underline",
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive("underline"),
      },
      {
        type: "item",
        icon: BiStrikethrough,
        title: "Strikethrough",
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive("strike"),
      },
      {
        type: "horizontal-list",
        label: "Lists",
        defaultIcon: BiListOl,
        items: [
          {
            type: "item",
            icon: BiListOl,
            title: "Ordered list",
            action: () => editor.chain().focus().toggleOrderedList().run(),
            isActive: () => editor.isActive("orderedList"),
          },
          {
            type: "item",
            icon: BiListUl,
            title: "Bullet list",
            action: () => editor.chain().focus().toggleBulletList().run(),
            isActive: () => editor.isActive("unorderedList"),
          },
        ],
      },
      {
        type: "item",
        icon: BiLink,
        title: "Link",
        action: onLinkModalOpen,
        isActive: () => editor.isActive("link"),
      },
      {
        type: "item",
        icon: MdSuperscript,
        title: "Superscript",
        action: () =>
          editor.chain().focus().unsetSubscript().toggleSuperscript().run(),
        isActive: () => editor.isActive("superscript"),
      },
      {
        type: "item",
        icon: MdSubscript,
        title: "Subscript",
        action: () =>
          editor.chain().focus().unsetSuperscript().toggleSubscript().run(),
        isActive: () => editor.isActive("subscript"),
      },
    ],
    [editor, onLinkModalOpen],
  )

  return (
    <>
      {isLinkModalOpen && (
        <Suspense fallback={null}>
          <TiptapLinkEditorModal
            editor={editor}
            isOpen={isLinkModalOpen}
            onClose={onLinkModalClose}
          />
        </Suspense>
      )}
      <MenuBar items={items} />
    </>
  )
}
