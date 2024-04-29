import { Node, mergeAttributes } from "@tiptap/core"
import type { IsomerTiptapNode } from "~/types"
import { ListItem, OrderedList, UnorderedList } from "./lists"

const components: Record<string, Record<string, IsomerTiptapNode>> = {
  // Components that can be directly used/created in the Tiptap editor
  block: {
    // FIXME: Need to redo accordion due to nesting
    // accordion: {
    //   content: "accordionSummary accordionDetails",
    // },
    accordion: {
      content: "inline*",
      selectable: true,
      attributes: {
        summary: "Accordion summary",
      },
    },
    callout: {
      content: "inline*",
      selectable: true,
      attributes: {
        variant: "info",
      },
    },
    divider: {
      atom: true,
    },
    heading: {
      content: "inline*",
      attributes: {
        id: "heading-id",
        level: "2",
      },
    },
    // hero: {},
    // iframe: {},
    // image: {},
    infobar: {
      atom: true,
      selectable: true,
      attributes: {
        title: "Infobar title",
        description: "Infobar description",
      },
    },
    // infocards: {},
    // infocols: {},
    // infopic: {},
    // keystatistics: {},
    paragraph: {
      content: "inline*",
      priority: 1000,
    },
  },
}

const componentNodes = Object.fromEntries(
  Object.entries(components).flatMap(([group, groupNodes]) => {
    return Object.entries(groupNodes).map(([type, node]) => {
      const nodeName =
        group === "block"
          ? type
          : `${group}${type.charAt(0).toUpperCase()}${type.slice(1)}`
      const { attributes, ...rest } = node

      return [
        nodeName,
        Node.create({
          ...rest,
          name: nodeName,
          group,
          draggable: true,

          addOptions() {
            return {
              HTMLAttributes: {},
            }
          },

          addAttributes() {
            if (!attributes) {
              return {}
            }

            return Object.fromEntries(
              Object.entries(attributes).map(([key, value]) => {
                return [key, { default: value }]
              }),
            )
          },

          renderHTML({ HTMLAttributes }) {
            return [
              this.name,
              mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
              0,
            ]
          },
        }),
      ]
    })
  }),
)

export const ISOMER_TIPTAP_COMPONENTS = {
  ...componentNodes,
  listItem: ListItem,
  orderedlist: OrderedList,
  unorderedlist: UnorderedList,
  // table: Table,
  // tableRow: TableRow,
  // tableHeader: TableHeader,
  // tableCell: TableCell,
}
