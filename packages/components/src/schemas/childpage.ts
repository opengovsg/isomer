import { Type } from "@sinclair/typebox"

export const ChildpagesSchema = Type.Object({
  layout: Type.Union([Type.Literal("boxes"), Type.Literal("rows")], {
    title: "Layout",
    format: "childpages",
    default: "boxes",
  }),
  summary: Type.Boolean({
    title: "Show summary of all child pages",
    default: false,
  }),
  thumbnail: Type.Boolean({
    title: "Show thumbnail of all child pages",
    description:
      "We will use the child pages' feature images as their thumbnail.",
    default: false,
  }),
})

export const getChildpageSchema = () => {
  return ChildpagesSchema
}
