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
  BiUnderline,
} from "react-icons/bi"
import { MdHorizontalRule, MdSubscript, MdSuperscript } from "react-icons/md"

import type { PossibleMenubarItemProps } from "./MenubarItem/types"
import { MenuBar } from "./MenuBar"
import { TiptapLinkEditorModal } from "./TiptapLinkEditorModal"

export const ProseMenuBar = ({ editor }: { editor: Editor }) => {
  const {
    isOpen: isLinkModalOpen,
    onOpen: onLinkModalOpen,
    onClose: onLinkModalClose,
  } = useDisclosure()

  const items: PossibleMenubarItemProps[] = useMemo(
    () => [
      {
        buttonWidth: "9rem",
        defaultTitle: "Text styles",
        isHidden: () => editor.isActive("table"),
        items: [
          {
            action: () =>
              editor.chain().focus().toggleHeading({ level: 2 }).run(),
            description: "Biggest heading for sections in your content",
            isActive: () => editor.isActive("heading", { level: 2 }),
            title: "Section heading",
            type: "item",
            useSecondaryColor: true,
          },
          {
            action: () =>
              editor.chain().focus().toggleHeading({ level: 3 }).run(),
            isActive: () => editor.isActive("heading", { level: 3 }),
            title: "Large heading",
            type: "item",
            useSecondaryColor: true,
          },
          {
            action: () =>
              editor.chain().focus().toggleHeading({ level: 4 }).run(),
            isActive: () => editor.isActive("heading", { level: 4 }),
            title: "Medium heading",
            type: "item",
            useSecondaryColor: true,
          },
          {
            action: () =>
              editor.chain().focus().toggleHeading({ level: 5 }).run(),
            isActive: () => editor.isActive("heading", { level: 5 }),
            title: "Small heading",
            type: "item",
            useSecondaryColor: true,
          },
          {
            action: () =>
              editor.chain().focus().clearNodes().unsetAllMarks().run(),
            isActive: () => editor.isActive("paragraph"),
            title: "Paragraph",
            type: "item",
          },
        ],
        menuWidth: "12.25rem",
        type: "vertical-list",
      },
      {
        isHidden: () => editor.isActive("table"),
        type: "divider",
      },
      {
        action: () => editor.chain().focus().toggleBold().run(),
        icon: BiBold,
        isActive: () => editor.isActive("bold"),
        title: "Bold",
        type: "item",
      },
      {
        action: () => editor.chain().focus().toggleItalic().run(),
        icon: BiItalic,
        isActive: () => editor.isActive("italic"),
        title: "Italicise",
        type: "item",
      },
      {
        action: () => editor.chain().focus().toggleUnderline().run(),
        icon: BiUnderline,
        isActive: () => editor.isActive("underline"),
        title: "Underline",
        type: "item",
      },
      {
        action: () => editor.chain().focus().toggleStrike().run(),
        icon: BiStrikethrough,
        isActive: () => editor.isActive("strike"),
        title: "Strikethrough",
        type: "item",
      },
      {
        defaultIcon: BiListOl,
        items: [
          {
            action: () => editor.chain().focus().toggleOrderedList().run(),
            icon: BiListOl,
            isActive: () => editor.isActive("orderedList"),
            title: "Ordered list",
            type: "item",
          },

          {
            action: () => editor.chain().focus().toggleBulletList().run(),
            icon: BiListUl,
            isActive: () => editor.isActive("unorderedList"),
            title: "Bullet list",
            type: "item",
          },
        ],
        label: "Lists",
        type: "horizontal-list",
      },
      {
        action: onLinkModalOpen,
        icon: BiLink,
        isActive: () => editor.isActive("link"),
        title: "Link",
        type: "item",
      },
      // Lesser-used commands are kept inside the overflow items list
      {
        items: [
          {
            action: () =>
              editor.chain().focus().unsetSubscript().toggleSuperscript().run(),
            icon: MdSuperscript,
            isActive: () => editor.isActive("superscript"),
            title: "Superscript",
            type: "item",
          },
          {
            action: () =>
              editor.chain().focus().unsetSuperscript().toggleSubscript().run(),
            icon: MdSubscript,
            isActive: () => editor.isActive("subscript"),
            title: "Subscript",
            type: "item",
          },
          {
            action: () => editor.chain().focus().setHorizontalRule().run(),
            icon: MdHorizontalRule,
            isActive: () => editor.isActive("divider"),
            title: "Divider",
            type: "item",
          },
        ],
        type: "overflow-list",
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
