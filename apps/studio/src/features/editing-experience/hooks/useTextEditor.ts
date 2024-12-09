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
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { textblockTypeInputRule, useEditor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"

import { getHtmlWithRelativeReferenceLinks } from "../utils"

const HEADING_LEVELS: Level[] = [2, 3, 4, 5]

export interface BaseEditorProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent) => void
}

const BASE_EXTENSIONS: Extensions = [
  Link.extend({
    addProseMirrorPlugins() {
      return [
        // NOTE: This plugin is used to transform links inside the HTML content
        // copied by the user from the preview, as browsers will automatically
        // transform relative links (in the form of [resource:siteId:resourceId])
        // into absolute links:
        // https://studio.isomer.gov.sg/sites/1/pages/[resource:siteId:resourceId]
        // This plugin will transform the absolute links back into the relative
        // links, so that the original link is preserved in the editor.
        new Plugin({
          key: new PluginKey("transformReferenceLinks"),
          props: {
            transformPastedHTML(html, _) {
              return getHtmlWithRelativeReferenceLinks(html)
            },
          },
        }),
        ...(this.parent?.() ?? []),
      ]
    },
  }).configure({
    HTMLAttributes: {
      rel: "",
      target: "_self",
    },
    openOnClick: false,
  }),
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
  HorizontalRule.extend({
    name: "divider",
  }),
  History,
  Italic,
  ListItem.extend({
    content: "paragraph list*",
  }).configure({
    bulletListTypeName: "unorderedList",
    orderedListTypeName: "orderedList",
  }),
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
    immediatelyRender: false,
    extensions: [
      ...BASE_EXTENSIONS,
      ...extensions,
      TextDirection.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })

export const useTextEditor = ({ data, handleChange }: BaseEditorProps) =>
  useBaseEditor({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    extensions: [],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange,
  })
}

export const useAccordionEditor = ({ data, handleChange }: BaseEditorProps) => {
  return useBaseEditor({
    extensions: [TableRow, IsomerTable, IsomerTableCell, IsomerTableHeader],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange,
  })
}

export const useProseEditor = ({ data, handleChange }: BaseEditorProps) =>
  useBaseEditor({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange,
    extensions: [IsomerHeading],
  })
