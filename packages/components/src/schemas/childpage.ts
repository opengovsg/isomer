import { Type } from "@sinclair/typebox"

export const CHILDPAGE_LAYOUT_OPTIONS = { Boxes: "boxes", Rows: "rows" }
export const ChildpagesSchema = Type.Object({
  layout: Type.Union(
    [
      Type.Literal(CHILDPAGE_LAYOUT_OPTIONS.Boxes),
      Type.Literal(CHILDPAGE_LAYOUT_OPTIONS.Rows),
    ],
    {
      title: "Layout",
      format: "childpages",
      default: CHILDPAGE_LAYOUT_OPTIONS.Boxes,
    },
  ),
  showSummary: Type.Boolean({
    title: "Show summary of all child pages",
    default: false,
  }),
  showThumbnail: Type.Boolean({
    title: "Show thumbnail of all child pages",
    description:
      "We will use the child pages' feature images as their thumbnail.",
    default: false,
  }),
})

export const getChildpageSchema = () => {
  return ChildpagesSchema
}
