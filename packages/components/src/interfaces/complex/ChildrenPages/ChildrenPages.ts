import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ChildrenPagesImageFitSchema } from "~/schemas/internal"
import { CHILDREN_PAGES_LAYOUT_OPTIONS } from "./constants"

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
    maxColumns: Type.Optional(
      Type.Union(
        [
          Type.Literal("2", { title: "2 columns" }),
          Type.Literal("3", { title: "3 columns" }),
        ],
        {
          title: "Number of columns",
          description:
            "This only affects how the block appears on large screens",
          default: "2",
          format: "childPagesCols",
        },
      ),
    ),
    imageFit: Type.Optional(ChildrenPagesImageFitSchema),
    // NOTE: We set this to `Optional` for now due to backcompat
    // TODO: Remove this chunk after we run the forward migration to
    // add this property to all index pages
    childrenPagesOrdering: Type.Optional(
      Type.Array(Type.String(), {
        default: [],
        format: "childrenPagesOrdering",
        title: "Ordering of Child pages",
        description: "Drag and drop pages to reorder them",
      }),
    ),
  },
  {
    title: "Child pages",
    description:
      "The child page component is used to display information about pages inside this folder",
  },
)

export interface ChildrenPagesProps extends Static<typeof ChildrenPagesSchema> {
  shouldLazyLoad?: boolean
  permalink: string
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
