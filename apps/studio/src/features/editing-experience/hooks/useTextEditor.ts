import type { ControlProps } from "@jsonforms/core"
import type { JSONContent } from "@tiptap/react"
import { Bold } from "@tiptap/extension-bold"
import { BulletList } from "@tiptap/extension-bullet-list"
import { Document } from "@tiptap/extension-document"
import { Dropcursor } from "@tiptap/extension-dropcursor"
import { Gapcursor } from "@tiptap/extension-gapcursor"
import { HardBreak } from "@tiptap/extension-hard-break"
import { Heading, Level } from "@tiptap/extension-heading"
import { History } from "@tiptap/extension-history"
import { HorizontalRule } from "@tiptap/extension-horizontal-rule"
import { Italic } from "@tiptap/extension-italic"
import { Link } from "@tiptap/extension-link"
import { ListItem } from "@tiptap/extension-list-item"
import { OrderedList } from "@tiptap/extension-ordered-list"
import { Paragraph } from "@tiptap/extension-paragraph"
import { Strike } from "@tiptap/extension-strike"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import { Text } from "@tiptap/extension-text"
import { Underline } from "@tiptap/extension-underline"
import { textblockTypeInputRule, useEditor } from "@tiptap/react"

const HEADING_LEVELS: Level[] = [2, 3, 4, 5, 6]

export interface BaseEditorProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent) => void
}

export const useTableEditor = ({ data, handleChange }: BaseEditorProps) =>
  useEditor({
    extensions: [
      Link,
      Bold,
      BulletList.extend({
        name: "unorderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-disc",
        },
      }),
      Document.extend({
        name: "prose",
      }),
      Dropcursor,
      Gapcursor,
      HardBreak,
      History,
      HorizontalRule.extend({
        name: "divider",
      }),
      Italic,
      ListItem,
      OrderedList.extend({
        name: "orderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-decimal",
        },
      }),
      Paragraph,
      Strike,
      Superscript,
      Subscript,
      Text,
      Underline,
      Table.extend({
        addAttributes() {
          return {
            caption: {
              default: "Table caption",
            },
          }
        },
      }),
      TableCell,
      TableHeader.extend({
        content: "paragraph+",
      }),
      TableRow,
    ],
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })

export const useTextEditor = ({ data, handleChange }: BaseEditorProps) =>
  useEditor({
    extensions: [
      Link,
      Bold,
      BulletList.extend({
        name: "unorderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-disc",
        },
      }),
      Document.extend({
        name: "prose",
      }),
      Dropcursor,
      Gapcursor,
      HardBreak,
      Heading.extend({
        content: "text*",
        marks: "",
        // NOTE: Have to override the default input rules
        // because we should map the number of `#` into
        // a h<num # + 1>.
        // eg: # -> h2
        //     ## -> h3
        addInputRules() {
          return HEADING_LEVELS.map((level) => {
            return textblockTypeInputRule({
              find: new RegExp(`^(#{1,${level - 1}})\\s$`),
              type: this.type,
              getAttributes: {
                level,
              },
            })
          })
        },
      }).configure({
        levels: HEADING_LEVELS,
      }),
      History,
      HorizontalRule.extend({
        name: "divider",
      }),
      Italic,
      ListItem,
      OrderedList.extend({
        name: "orderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-decimal",
        },
      }),
      Paragraph,
      Strike,
      Superscript,
      Subscript,
      Text,
      Underline,
    ],
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })

export const useCalloutEditor = ({ data, handleChange }: BaseEditorProps) => {
  return useEditor({
    extensions: [
      Link,
      Bold,
      BulletList.extend({
        name: "unorderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-disc",
        },
      }),
      Document.extend({
        name: "prose",
      }),
      Dropcursor,
      Gapcursor,
      HardBreak,
      History,
      HorizontalRule.extend({
        name: "divider",
      }),
      Italic,
      ListItem,
      OrderedList.extend({
        name: "orderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-decimal",
        },
      }),
      Paragraph,
      Strike,
      Superscript,
      Subscript,
      Text,
      Underline,
    ],
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })
}

export const useAccordionEditor = ({ data, handleChange }: BaseEditorProps) => {
  return useEditor({
    extensions: [
      Link,
      Bold,
      BulletList.extend({
        name: "unorderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-disc",
        },
      }),
      Document.extend({
        name: "prose",
      }),
      Dropcursor,
      Gapcursor,
      HardBreak,
      History,
      HorizontalRule.extend({
        name: "divider",
      }),
      Italic,
      ListItem,
      OrderedList.extend({
        name: "orderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-decimal",
        },
      }),
      Paragraph,
      Text,
      Underline,
    ],
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })
}
