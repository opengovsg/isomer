import type { Editor } from "@tiptap/react"
import { useDisclosure } from "@chakra-ui/react"
import { useMemo } from "react"
import {
  BiBold,
  BiItalic,
  BiLink,
  BiListOl,
  BiListUl,
  BiStrikethrough,
  BiTable,
  BiUnderline,
} from "react-icons/bi"
import { MdHorizontalRule, MdSubscript, MdSuperscript } from "react-icons/md"

import type { PossibleMenubarItemProps } from "./MenubarItem/types"
import { MenuBar } from "./MenuBar"
import { TiptapLinkEditorModal } from "./TiptapLinkEditorModal"

export const AccordionMenuBar = ({ editor }: { editor: Editor }) => {
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
        type: "divider",
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
        type: "divider",
      },
      {
        type: "item",
        icon: BiLink,
        title: "Link",
        action: onLinkModalOpen,
        isActive: () => editor.isActive("link"),
      },
      {
        type: "divider",
      },
      {
        // Delete table is covered by TableBubbleMenu's "Delete table" action
        // (whole-table selection), and the caption is now edited inline via
        // TableCaption — so this button only needs to insert.
        type: "item",
        icon: BiTable,
        title: "Table",
        action: () => editor.chain().focus().insertTable().run(),
      },
      // Lesser-used commands are kept inside the overflow items list
      {
        type: "overflow-list",
        items: [
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
          {
            type: "item",
            icon: MdHorizontalRule,
            title: "Divider",
            action: () => editor.chain().focus().setHorizontalRule().run(),
            isActive: () => editor.isActive("divider"),
          },
        ],
      },
    ],
    [editor, onLinkModalOpen],
  )
  return (
    <>
      <TiptapLinkEditorModal
        editor={editor}
        isOpen={isLinkModalOpen}
        onClose={onLinkModalClose}
      />

      <MenuBar items={items} />
    </>
  )
}
