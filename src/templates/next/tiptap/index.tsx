import { Extension } from "@tiptap/core"
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react"
import { ISOMER_TIPTAP_COMPONENTS } from "~/tiptap"
import { renderComponent } from "../layouts"

const TOP_LEVEL_CLASSES: Record<string, string> = {
  accordion: "has-[+_*:has(>_details)]:border-b-0",
  callout: "[&:not(:first-child)]:mt-8",
  paragraph: "[&:not(:first-child)]:mt-6",
  table: "[&:not(:first-child)]:mt-6",
}

const IsomerNextTiptap = Extension.create({
  name: "isomerNext",

  addExtensions() {
    return Object.entries(ISOMER_TIPTAP_COMPONENTS).map(([type, extension]) => {
      return extension.extend({
        addNodeView() {
          return ReactNodeViewRenderer(
            ({ node }: any) =>
              renderComponent({
                component: {
                  type,
                  NodeViewWrapper,
                  NodeViewContent,
                  ...node.attrs,
                },
              }),
            {
              className: Object.keys(TOP_LEVEL_CLASSES).includes(type)
                ? TOP_LEVEL_CLASSES[type]
                : undefined,
            },
          )
        },
      })
    })
  },
})

export default IsomerNextTiptap
