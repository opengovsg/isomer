import type { Level } from "@tiptap/extension-heading"
import type { Extensions } from "@tiptap/react"
import type { Editor } from "@tiptap/react"
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
import { ReactNodeViewRenderer, textblockTypeInputRule } from "@tiptap/react"
import { TableNodeView } from "~/features/editing-experience/components/TableCaption/TableNodeView"
import { DEFAULT_TABLE_CAPTION } from "~/features/editing-experience/components/TableCaption/utils"

import {
  focusTableBubbleMenuTrigger,
  runTableBubbleMenuFocusTrigger,
} from "../../components/TableBubbleMenu/tableBubbleMenuFocus"
import {
  createTableSelectionBorderPlugin,
  getHtmlWithRelativeReferenceLinks,
} from "../../utils"
import { selectTableCellContent } from "./selectTableCellContent"

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
  HardBreak,
  History,
  Italic,
  Paragraph,
  Text,
  Underline,
]

export const PROSE_EXTENSIONS: Extensions = [
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
  // Higher than TipTap's default keymap so Mod-a is handled here first.
  priority: 101,
  addCommands() {
    return {
      ...this.parent?.(),
      focusTableBubbleMenuTrigger:
        () =>
        ({ editor }: { editor: Editor }) =>
          runTableBubbleMenuFocusTrigger(editor),
    }
  },
  addAttributes() {
    return {
      caption: {
        default: DEFAULT_TABLE_CAPTION,
      },
    }
  },
  // Replaces TipTap's built-in `TableView` so the caption renders above the
  // table as part of the node itself. `contentDOMElementTag: "tbody"` keeps the
  // structure ProseMirror expects — `<table><tbody>` with the rows inside the
  // tbody. Column resizing is off (`resizable` defaults to false), so there is
  // no `<colgroup>` to maintain: widths come from `table-layout: fixed` in
  // `styles/tiptap.scss`, as before.
  addNodeView() {
    return ReactNodeViewRenderer(TableNodeView, {
      contentDOMElementTag: "tbody",
    })
  },
  addKeyboardShortcuts() {
    const parentShortcuts = this.parent?.() ?? {}
    return {
      ...parentShortcuts,
      "Mod-a": () =>
        selectTableCellContent(this.editor) || this.editor.commands.selectAll(),
      // The base extension's Tab always calls goToNextCell, which keeps
      // keyboard focus trapped inside the table. When the bubble menu's
      // trigger is showing (an actionable multi-cell selection), send focus
      // there instead so the trigger stays keyboard-reachable.
      Tab: ({ editor }) => {
        if (focusTableBubbleMenuTrigger(editor)) {
          return true
        }
        return parentShortcuts.Tab?.({ editor }) ?? false
      },
    }
  },
  addProseMirrorPlugins() {
    return [...(this.parent?.() ?? []), createTableSelectionBorderPlugin()]
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
