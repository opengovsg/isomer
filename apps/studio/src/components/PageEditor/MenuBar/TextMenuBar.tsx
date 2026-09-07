/* oxlint-disable eslint/sort-keys -- studio lint cleanup */
/* oxlint-disable typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access, oxc/parse-error -- studio lint cleanup */
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
            textStyle: "body-1",
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
        action: () => {
          editor.chain().focus().toggleBold().run()
        },
        icon: BiBold,
        isActive: () => editor.isActive("bold"),
        title: "Bold",
        type: "item",
      },
      {
        action: () => {
          editor.chain().focus().toggleItalic().run()
        },
        icon: BiItalic,
        isActive: () => editor.isActive("italic"),
        title: "Italicise",
        type: "item",
      },
      {
        action: () => {
          editor.chain().focus().toggleUnderline().run()
        },
        icon: BiUnderline,
        isActive: () => editor.isActive("underline"),
        title: "Underline",
        type: "item",
      },
      {
        action: () => {
          editor.chain().focus().toggleStrike().run()
        },
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
            action: () => editor.chain().focus().addColumnAfter().run(),
            icon: IconAddColRight,
            title: "Add column after",
            type: "item",
          },
          {
            action: () => editor.chain().focus().addColumnBefore().run(),
            icon: IconAddColLeft,
            title: "Add column before",
            type: "item",
          },
          {
            action: () => editor.chain().focus().deleteColumn().run(),
            icon: IconDelCol,
            title: "Delete column",
            type: "item",
          },
          {
            action: () => editor.chain().focus().addRowBefore().run(),
            icon: IconAddRowAbove,
            title: "Add row before",
            type: "item",
          },
          {
            action: () => editor.chain().focus().addRowAfter().run(),
            icon: IconAddRowBelow,
            title: "Add row after",
            type: "item",
          },
          {
            action: () => editor.chain().focus().deleteRow().run(),
            icon: IconDelRow,
            title: "Delete row",
            type: "item",
          },
          {
            action: () => editor.chain().focus().mergeCells().run(),
            icon: IconMergeCells,
            title: "Merge cells",
            type: "item",
          },
          {
            action: () => editor.chain().focus().splitCell().run(),
            icon: IconSplitCell,
            title: "Split cell",
            type: "item",
          },
          {
            action: onTableSettingsModalOpen,
            icon: BiCog,
            title: "Table settings",
            type: "item",
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
            action: () =>
              editor.chain().focus().unsetSubscript().toggleSuperscript().run(),
            icon: MdSuperscript,
            isActive: () => editor.isActive("superscript"),
            isHidden: () => editor.isActive("table"),
            title: "Superscript",
            type: "item",
          },
          {
            action: () =>
              editor.chain().focus().unsetSuperscript().toggleSubscript().run(),
            icon: MdSubscript,
            isActive: () => editor.isActive("subscript"),
            isHidden: () => editor.isActive("table"),
            title: "Subscript",
            type: "item",
          },
          {
            action: () => editor.chain().focus().setHorizontalRule().run(),
            icon: MdHorizontalRule,
            isActive: () => editor.isActive("divider"),
            isHidden: () => editor.isActive("table"),
            title: "Divider",
            type: "item",
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
