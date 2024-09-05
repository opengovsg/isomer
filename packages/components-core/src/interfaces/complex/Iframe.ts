import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const IframeSchema = Type.Object(
  {
    type: Type.Literal("iframe", { default: "iframe" }),
    content: Type.String({
      title: "Embed code",
      description:
        "Paste in an embed code. Refer to the guide to understand how to embed your content.",
    }),
    title: Type.String({
      title: "Description",
      description:
        "Briefly describe what the embedded content is about. This isn’t displayed on the page but is accessible to screen readers.",
    }),
  },
  {
    title: "Iframe component",
    description:
      "The iframe component is used to embed a whitelisted external webpage within the current page.",
  },
)

export type IframeProps = Static<typeof IframeSchema>
