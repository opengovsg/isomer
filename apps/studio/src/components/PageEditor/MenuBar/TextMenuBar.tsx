import type { Editor } from "@tiptap/react"
import { useDisclosure } from "@chakra-ui/react"
import { useMemo } from "react"
import {
  BiBold,
  BiCog,
  BiItalic,
  BiLink,
  BiListOl,
  BiListUl,
  BiStrikethrough,
  BiUnderline,
  BiWrench,
} from "react-icons/bi"
import { MdHorizontalRule, MdSubscript, MdSuperscript } from "react-icons/md"
import {
  IconAddColLeft,
  IconAddColRight,
  IconAddRowAbove,
  IconAddRowBelow,
  IconDelCol,
  IconDelRow,
  IconMergeCells,
  IconSplitCell,
} from "~/components/icons"
import { TableSizePicker } from "~/features/editing-experience/components/TableSizePicker/TableSizePicker"

import type { PossibleMenubarItemProps } from "./MenubarItem/types"
import { TableSettingsModal } from "../TableSettingsModal"
import { MenuBar } from "./MenuBar"
import { TiptapLinkBubbleMenu } from "./TiptapLinkBubbleMenu"
import { TiptapLinkEditorModal } from "./TiptapLinkEditorModal"

export const TextMenuBar = ({ editor }: { editor: Editor }) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()
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
        label: "Lists",
        type: "horizontal-list",
      },
      {
        type: "divider",
      },
      {
        action: onLinkModalOpen,
        icon: BiLink,
        isActive: () => editor.isActive("link"),
        title: "Link",
        type: "item",
      },
      {
        // A grid-based size picker when not in a table (insert), or a plain
        // delete button when a table is selected — see TableSizePicker.
        type: "custom",
        render: () => <TableSizePicker editor={editor} />,
      },
      // Table-specific commands
      {
        defaultIcon: BiWrench,
        isHidden: () => !editor.isActive("table"),
        items: [
          {
            type: "item",
            icon: IconAddColRight,
            title: "Add column after",
            action: () => editor.chain().focus().addColumnAfter().run(),
          },
          {
            type: "item",
            icon: IconAddColLeft,
            title: "Add column before",
            action: () => editor.chain().focus().addColumnBefore().run(),
          },
          {
            type: "item",
            icon: IconDelCol,
            title: "Delete column",
            action: () => editor.chain().focus().deleteColumn().run(),
          },
          {
            type: "item",
            icon: IconAddRowAbove,
            title: "Add row before",
            action: () => editor.chain().focus().addRowBefore().run(),
          },
          {
            type: "item",
            icon: IconAddRowBelow,
            title: "Add row after",
            action: () => editor.chain().focus().addRowAfter().run(),
          },
          {
            type: "item",
            icon: IconDelRow,
            title: "Delete row",
            action: () => editor.chain().focus().deleteRow().run(),
          },
          {
            type: "item",
            icon: IconMergeCells,
            title: "Merge cells",
            action: () => editor.chain().focus().mergeCells().run(),
          },
          {
            type: "item",
            icon: IconSplitCell,
            title: "Split cell",
            action: () => editor.chain().focus().splitCell().run(),
          },
          {
            type: "item",
            icon: BiCog,
            title: "Table settings",
            action: onTableSettingsModalOpen,
          },
        ],
        label: "Table",
        type: "horizontal-list",
      },
      // Table-scoped: promoted onto the main toolbar instead of the overflow
      // menu while editing inside a table, same as the "Table" group above.
      {
        action: () =>
          editor.chain().focus().unsetSubscript().toggleSuperscript().run(),
        icon: MdSuperscript,
        isActive: () => editor.isActive("superscript"),
        isHidden: () => !editor.isActive("table"),
        title: "Superscript",
        type: "item",
      },
      {
        action: () =>
          editor.chain().focus().unsetSuperscript().toggleSubscript().run(),
        icon: MdSubscript,
        isActive: () => editor.isActive("subscript"),
        isHidden: () => !editor.isActive("table"),
        title: "Subscript",
        type: "item",
      },
      // Lesser-used commands are kept inside the overflow items list
      {
        items: [
          {
            type: "item",
            icon: MdSuperscript,
            title: "Superscript",
            isHidden: () => editor.isActive("table"),
            action: () =>
              editor.chain().focus().unsetSubscript().toggleSuperscript().run(),
            isActive: () => editor.isActive("superscript"),
          },
          {
            type: "item",
            icon: MdSubscript,
            title: "Subscript",
            isHidden: () => editor.isActive("table"),
            action: () =>
              editor.chain().focus().unsetSuperscript().toggleSubscript().run(),
            isActive: () => editor.isActive("subscript"),
          },
          {
            type: "item",
            icon: MdHorizontalRule,
            title: "Divider",
            isHidden: () => editor.isActive("table"),
            action: () => editor.chain().focus().setHorizontalRule().run(),
            isActive: () => editor.isActive("divider"),
          },
        ],
        type: "overflow-list",
      },
    ],
    [editor, onLinkModalOpen, onTableSettingsModalOpen],
  )
  return (
    <>
      <TableSettingsModal
        editor={editor}
        isOpen={isTableSettingsModalOpen}
        onClose={onTableSettingsModalClose}
      />

      <TiptapLinkEditorModal
        editor={editor}
        isOpen={isLinkModalOpen}
        onClose={onLinkModalClose}
      />

      <TiptapLinkBubbleMenu
        editor={editor}
        onEdit={onLinkModalOpen}
        isLinkModalOpen={isLinkModalOpen}
      />

      <MenuBar items={items} />
    </>
  )
}
