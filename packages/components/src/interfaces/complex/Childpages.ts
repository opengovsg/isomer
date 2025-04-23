import { Type } from "@sinclair/typebox"

export const ChildpagesSchema = Type.Object({
  type: Type.Literal("childpages", { default: "childpages" }),
  layout: Type.Union([Type.Literal("boxes"), Type.Literal("rows")], {
    title: "Layout",
  }),
  summary: Type.Union([Type.Literal("show"), Type.Literal("hide")], {
    title: "Show summary of all child pages",
  }),
  thumbnail: Type.Union([Type.Literal("show"), Type.Literal("hide")], {
    title: "Show thumbnail of all child pages",
    description:
      "We will use the child pages' feature images as their thumbnail.",
  }),
})
