import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"

import type { IsomerSiteProps, LinkComponentType } from "~/types"

export const CHILDREN_PAGES_LAYOUT_OPTIONS = { Boxes: "boxes", Rows: "rows" }
export const ChildrenPagesSchema = Type.Object(
  {
    type: Type.Literal("childrenpages", { default: "childrenpages" }),
    variant: Type.Union(
      [
        Type.Literal(CHILDREN_PAGES_LAYOUT_OPTIONS.Boxes),
        Type.Literal(CHILDREN_PAGES_LAYOUT_OPTIONS.Rows),
      ],
      {
        title: "Layout",
        format: "childrenpages",
        default: CHILDREN_PAGES_LAYOUT_OPTIONS.Rows,
      },
    ),
    showSummary: Type.Boolean({
      title: "Show summary of all child pages",
      default: true,
    }),
    showThumbnail: Type.Boolean({
      title: "Show thumbnail of all child pages",
      description:
        "We will use the child pages' feature images as their thumbnail.",
      default: false,
    }),
    childrenPagesOrdering: Type.Array(Type.String(), {
      default: [],
      format: "childrenPagesOrdering",
      title: "Ordering of Child pages",
      description: "Drag and drop pages to reorder them",
    }),
  },
  {
    title: "Child pages",
    description:
      "The child page component is used to display information about pages inside this folder",
  },
)

export const DEFAULT_CHILDREN_PAGES_BLOCK = Value.Parse(
  ChildrenPagesSchema,
  Value.Default(ChildrenPagesSchema, {}),
)

export interface ChildrenPagesProps extends Static<typeof ChildrenPagesSchema> {
  permalink: string
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
