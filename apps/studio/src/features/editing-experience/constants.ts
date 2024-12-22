import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { Level } from "@tiptap/extension-heading"
import type { Extensions } from "@tiptap/react"
import type { IconType } from "react-icons"
import { DYNAMIC_DATA_BANNER_TYPE } from "@opengovsg/isomer-components"
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
import {
  BiChevronDown,
  BiCloud,
  BiCrown,
  BiHash,
  BiImage,
  BiMap,
  BiMoviePlay,
  BiPointer,
  BiSolidQuoteAltLeft,
  BiText,
} from "react-icons/bi"
import { FaYoutube } from "react-icons/fa"
import { TbApi } from "react-icons/tb"

import { ContentpicIcon } from "./components/icons/Contentpic"
import { InfocardsIcon } from "./components/icons/Infocards"
import { InfocolsIcon } from "./components/icons/Infocols"
import { InfopicIcon } from "./components/icons/Infopic"
import { getHtmlWithRelativeReferenceLinks } from "./utils"

export const TYPE_TO_ICON: Record<
  IsomerSchema["content"][number]["type"],
  IconType
> = {
  prose: BiText,
  image: BiImage,
  infopic: InfopicIcon,
  keystatistics: BiHash,
  contentpic: ContentpicIcon,
  callout: BiSolidQuoteAltLeft,
  infocards: InfocardsIcon,
  infobar: BiPointer,
  infocols: InfocolsIcon,
  accordion: BiChevronDown,
  hero: BiCrown,
  iframe: FaYoutube,
  map: BiMap,
  video: BiMoviePlay,
  logocloud: BiCloud,
  [DYNAMIC_DATA_BANNER_TYPE]: TbApi,
  // TODO: Add in these new block types
  // table: BiTable,
  // divider: DividerIcon,
  // iframe-gmap,
  // iframe-formsg
  // iframe-youtube
}

export const REFERENCE_LINK_REGEX = /\[resource:(\d+):(\d+)\]/

export const HEADING_LEVELS: Level[] = [2, 3, 4, 5]

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
  Bold.extend({
    parseHTML() {
      return [
        {
          tag: "strong",
        },
        {
          tag: "dt",
        },
        {
          tag: "b",
          getAttrs: (node) => node.style.fontWeight !== "normal" && null,
        },
        {
          style: "font-weight=400",
          clearMark: (mark) => mark.type.name === this.name,
        },
        {
          style: "font-weight",
          getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
        },
      ]
    },
  }),
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
  Paragraph.extend({
    parseHTML() {
      return [{ tag: "p" }, { tag: "dd" }]
    },
  }),
  Strike,
  Superscript,
  Subscript,
  Text,
  Underline.extend({
    parseHTML() {
      return [
        {
          tag: "u",
        },
        {
          style: "text-decoration",
          consuming: false,
          getAttrs: (style) => (style.includes("underline") ? {} : false),
        },
        {
          tag: 'span[style*="text-decoration: underline"]',
          consuming: false,
        },
      ]
    },
  }),
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
