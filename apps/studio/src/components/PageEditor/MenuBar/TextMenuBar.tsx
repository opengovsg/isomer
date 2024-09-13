import type { Editor } from "@tiptap/react"
import { useMemo } from "react"
import {
  BiBold,
  BiItalic,
  BiListOl,
  BiListUl,
  BiStrikethrough,
  BiUnderline,
} from "react-icons/bi"
import { MdSubscript, MdSuperscript } from "react-icons/md"

import type { MenuBarEntry } from "./MenuBar"
import { MenuBar } from "./MenuBar"

export const TextMenuBar = ({ editor }: { editor: Editor }) => {
  const items: MenuBarEntry[] = useMemo(
    () => [
      {
        type: "vertical-list",
        buttonWidth: "9rem",
        menuWidth: "19rem",
        defaultTitle: "Text styles",
        items: [
          {
            type: "item",
            title: "Heading 1",
            textStyle: "h2",
            useSecondaryColor: true,
            action: () =>
              editor.chain().focus().toggleHeading({ level: 2 }).run(),
            isActive: () => editor.isActive("heading", { level: 2 }),
          },
          {
            type: "item",
            title: "Heading 2",
            textStyle: "h3",
            useSecondaryColor: true,
            action: () =>
              editor.chain().focus().toggleHeading({ level: 3 }).run(),
            isActive: () => editor.isActive("heading", { level: 3 }),
          },
          {
            type: "item",
            title: "Heading 3",
            textStyle: "h4",
            useSecondaryColor: true,
            action: () =>
              editor.chain().focus().toggleHeading({ level: 4 }).run(),
            isActive: () => editor.isActive("heading", { level: 4 }),
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
        type: "item",
        icon: MdSuperscript,
        title: "Superscript",
        action: () => editor.chain().focus().toggleSuperscript().run(),
        isActive: () => editor.isActive("superscript"),
      },
      {
        type: "item",
        icon: MdSubscript,
        title: "Subscript",
        action: () => editor.chain().focus().toggleSubscript().run(),
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
            isActive: () => editor.isActive("bulletList"),
          },
        ],
      },
    ],
    [editor],
  )

  return <MenuBar items={items} />
}
