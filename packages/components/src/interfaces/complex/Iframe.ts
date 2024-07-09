import { Type, type Static } from "@sinclair/typebox"

export const IframeSchema = Type.Object(
  {
    type: Type.Literal("iframe"),
    title: Type.String({
      title: "Iframe title",
      description: "The title of the iframe",
    }),
    content: Type.String({
      title: "Iframe content",
      description:
        "The full iframe embed code to display, should only contain the <iframe> tag",
    }),
  },
  {
    title: "Iframe component",
    description:
      "The iframe component is used to embed a whitelisted external webpage within the current page.",
  },
)

export type IframeProps = Static<typeof IframeSchema>
