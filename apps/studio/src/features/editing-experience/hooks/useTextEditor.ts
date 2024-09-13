import type { ControlProps } from "@jsonforms/core"
import type { Level } from "@tiptap/extension-heading"
import type { Extensions, JSONContent } from "@tiptap/react"
import { Bold } from "@tiptap/extension-bold"
import { BulletList } from "@tiptap/extension-bullet-list"
import { Document } from "@tiptap/extension-document"
import { Dropcursor } from "@tiptap/extension-dropcursor"
import { Gapcursor } from "@tiptap/extension-gapcursor"
import { HardBreak } from "@tiptap/extension-hard-break"
import { Heading } from "@tiptap/extension-heading"
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

const BASE_EXTENSIONS: Extensions = [
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
]

const IsomerHorizontalRule = HorizontalRule.extend({
  name: "divider",
})

const IsomerTable = Table.extend({
  addAttributes() {
    return {
      caption: {
        default: "Table caption",
      },
    }
  },
})
const IsomerTableCell = TableCell.extend({ content: "(paragraph|list)+" })
const IsomerTableHeader = TableHeader.extend({
  content: "paragraph+",
})

const IsomerHeading = Heading.extend({
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
})

const useBaseEditor = ({
  data,
  handleChange,
  extensions,
}: BaseEditorProps & { extensions: Extensions }) =>
  useEditor({
    extensions: [...BASE_EXTENSIONS, ...extensions],
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })

export const useTextEditor = ({ data, handleChange }: BaseEditorProps) =>
  useBaseEditor({
    data,
    handleChange,
    extensions: [
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
      IsomerHeading,
    ],
  })

export const useCalloutEditor = ({ data, handleChange }: BaseEditorProps) => {
  return useBaseEditor({
    extensions: [IsomerHorizontalRule],
    data,
    handleChange,
  })
}

export const useAccordionEditor = ({ data, handleChange }: BaseEditorProps) => {
  return useBaseEditor({
    extensions: [TableRow, IsomerTable, IsomerTableCell, IsomerTableHeader],
    data,
    handleChange,
  })
}
