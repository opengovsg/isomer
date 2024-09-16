import type { Editor } from "@tiptap/react"
import { useMemo } from "react"
import { Icon, useDisclosure } from "@chakra-ui/react"
import {
  BiBold,
  BiCog,
  BiItalic,
  BiListOl,
  BiListUl,
  BiStrikethrough,
  BiTable,
  BiUnderline,
} from "react-icons/bi"
import { MdSubscript, MdSuperscript } from "react-icons/md"

import type { MenuBarEntry } from "./MenuBar"
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
import { TableSettingsModal } from "../TableSettingsModal"
import { MenuBar } from "./MenuBar"

export const AccordionMenuBar = ({ editor }: { editor: Editor }) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()
  const items: MenuBarEntry[] = useMemo(
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

      // Table-specific commands
      {
        type: "divider",
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: () => <Icon as={IconAddColRight} />,
        title: "Add column after",
        action: () => editor.chain().focus().addColumnAfter().run(),
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: () => <Icon as={IconAddColLeft} />,
        title: "Add column before",
        action: () => editor.chain().focus().addColumnBefore().run(),
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: () => <Icon as={IconDelCol} />,
        title: "Delete column",
        action: () => editor.chain().focus().deleteColumn().run(),
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: () => <Icon as={IconAddRowAbove} />,
        title: "Add row before",
        action: () => editor.chain().focus().addRowBefore().run(),
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: () => <Icon as={IconAddRowBelow} />,
        title: "Add row after",
        action: () => editor.chain().focus().addRowAfter().run(),
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: () => <Icon as={IconDelRow} />,
        title: "Delete row",
        action: () => editor.chain().focus().deleteRow().run(),
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "divider",
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: () => <Icon as={IconMergeCells} />,
        title: "Merge cells",
        action: () => editor.chain().focus().mergeCells().run(),
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: () => <Icon as={IconSplitCell} />,
        title: "Split cell",
        action: () => editor.chain().focus().splitCell().run(),
        isHidden: () => !editor.isActive("table"),
      },
      {
        type: "item",
        icon: BiCog,
        title: "Table settings",
        action: onTableSettingsModalOpen,
        isHidden: () => !editor.isActive("table"),
      },
    ],
    [editor, onTableSettingsModalOpen],
  )
  return (
    <>
      <TableSettingsModal
        editor={editor}
        isOpen={isTableSettingsModalOpen}
        onClose={onTableSettingsModalClose}
      />

      <MenuBar items={items} />
    </>
  )
}
