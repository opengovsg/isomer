import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const IframeSchema = Type.Object(
  {
    content: Type.String({
      description:
        "Paste in an embed code. Refer to the guide to understand how to embed your content.",
      title: "Embed code",
    }),
    title: Type.String({
      description:
        "Briefly describe what the embedded content is about. This isn’t displayed on the page but is accessible to screen readers.",
      title: "Description",
    }),
    type: Type.Literal("iframe", { default: "iframe" }),
  },
  {
    description:
      "The iframe component is used to embed a whitelisted external webpage within the current page.",
    title: "Iframe",
  },
)

export type IframeProps = Static<typeof IframeSchema> & {
  shouldLazyLoad?: boolean
}
