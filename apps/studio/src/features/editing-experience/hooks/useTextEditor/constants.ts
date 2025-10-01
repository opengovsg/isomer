import type { Level } from "@tiptap/extension-heading"
import type { Extensions } from "@tiptap/react"
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
import { Text } from "@tiptap/extension-text"
import { Underline } from "@tiptap/extension-underline"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { textblockTypeInputRule } from "@tiptap/react"

import { getHtmlWithRelativeReferenceLinks } from "../../utils"

export { TableRow } from "@tiptap/extension-table-row"

export const HEADING_TYPE = "heading"
export const PARAGRAPH_TYPE = "paragraph"

const HEADING_LEVELS: Level[] = [2, 3, 4, 5]

export const BASE_EXTENSIONS: Extensions = [
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
  Document.extend({
    name: "prose",
  }),
  Dropcursor,
  Gapcursor,
  HardBreak.extend({
    // Prevent the default behavior of the hard break and split it into a new paragraph instead
    // Why: Hard break introduces touch targets of under 24px between lines
    // This is a WCAG violation if the link is a clickable link
    addKeyboardShortcuts() {
      return {
        "Mod-Enter": () => this.editor.commands.splitBlock(),
        "Shift-Enter": () => this.editor.commands.splitBlock(),
      }
    },
  }),
  History,
  Italic,
  Paragraph,
  Text,
  Underline,
]

export const BASE_PROSE_EXTENSIONS: Extensions = [
  BulletList.extend({
    name: "unorderedList",
  }).configure({
    HTMLAttributes: {
      class: "list-disc",
    },
  }),
  HorizontalRule.extend({
    name: "divider",
  }),
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
  Strike,
  Superscript,
  Subscript,
]

export const IsomerTable = Table.extend({
  addAttributes() {
    return {
      caption: {
        default: "Table caption",
      },
    }
  },
})

export const IsomerTableCell = TableCell.extend({
  content: "(paragraph|list)+",
})

export const IsomerTableHeader = TableHeader.extend({
  content: "paragraph+",
})

export const IsomerHeading = Heading.extend({
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
