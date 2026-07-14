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

export const TextMenuBar = ({ editor }: { editor: Editor }) => {
  const {
    isOpen: isLinkModalOpen,
    onOpen: onLinkModalOpen,
    onClose: onLinkModalClose,
  } = useDisclosure()

  const items: PossibleMenubarItemProps[] = useMemo(
    () => [
      {
        type: "vertical-list",
        buttonWidth: "9rem",
        menuWidth: "12.25rem",
        defaultTitle: "Text styles",
        items: [
          {
            type: "item",
            title: "Section heading",
            description: "Biggest heading for sections in your content",
            useSecondaryColor: true,
            action: () =>
              editor.chain().focus().toggleHeading({ level: 2 }).run(),
            isActive: () => editor.isActive("heading", { level: 2 }),
          },
          {
            type: "item",
            title: "Large heading",
            useSecondaryColor: true,
            action: () =>
              editor.chain().focus().toggleHeading({ level: 3 }).run(),
            isActive: () => editor.isActive("heading", { level: 3 }),
          },
          {
            type: "item",
            title: "Medium heading",
            useSecondaryColor: true,
            action: () =>
              editor.chain().focus().toggleHeading({ level: 4 }).run(),
            isActive: () => editor.isActive("heading", { level: 4 }),
          },
          {
            type: "item",
            title: "Small heading",
            useSecondaryColor: true,
            action: () =>
              editor.chain().focus().toggleHeading({ level: 5 }).run(),
            isActive: () => editor.isActive("heading", { level: 5 }),
          },
          {
            type: "item",
            title: "Paragraph",
            textStyle: "body-1",
            action: () =>
              editor.chain().focus().clearNodes().unsetAllMarks().run(),
            isActive: () => editor.isActive("paragraph"),
          },
        ],

        isHidden: () => editor.isActive("table"),
      },
      {
        type: "divider",
        isHidden: () => editor.isActive("table"),
      },
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
        // Toggle: insert when outside a table, delete when inside. Without the
        // isActive guard, insertTable() nests/splits the current table.
        // Whole-table CellSelection also surfaces "Delete table" on
        // TableBubbleMenu; this toolbar toggle matches pre-bubble-menu UX.
        type: "item",
        icon: BiTable,
        title: "Table",
        action: () => {
          if (editor.isActive("table")) {
            return editor.chain().focus().deleteTable().run()
          }
          return editor.chain().focus().insertTable().run()
        },
        isActive: () => editor.isActive("table"),
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
