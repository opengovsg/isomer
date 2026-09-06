import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { ChildrenPagesImageFitSchema } from "~/schemas/internal"

import { CHILDREN_PAGES_LAYOUT_OPTIONS } from "./constants"

export const ChildrenPagesSchema = Type.Object(
  {
    // NOTE: We set this to `Optional` for now due to backcompat
    // NOTE: Remove this chunk after we run the forward migration to
    // add this property to all index pages
    childrenPagesOrdering: Type.Optional(
      Type.Array(Type.String(), {
        default: [],
        description: "Drag and drop pages to reorder them",
        format: "childrenPagesOrdering",
        title: "Ordering of Child pages",
      }),
    ),
    imageFit: Type.Optional(ChildrenPagesImageFitSchema),
    isHidden: Type.Optional(
      Type.Boolean({
        default: false,
        // Hide from form editor UI
        format: "hidden",
      }),
    ),
    maxColumns: Type.Optional(
      Type.Union(
        [
          Type.Literal("2", { title: "2 columns" }),
          Type.Literal("3", { title: "3 columns" }),
        ],
        {
          default: "2",
          description:
            "This only affects how the block appears on large screens",
          format: "childPagesCols",
          title: "Number of columns",
        },
      ),
    ),
    showSummary: Type.Boolean({
      default: true,
      title: "Show summary of all child pages",
    }),
    showThumbnail: Type.Boolean({
      default: false,
      description:
        "Publish the child page for thumbnail changes to appear here. Pages without a thumbnail will show the site’s logo.",
      title: "Show thumbnail of all child pages",
    }),
    type: Type.Literal("childrenpages", { default: "childrenpages" }),
    variant: Type.Union(
      [
        Type.Literal(CHILDREN_PAGES_LAYOUT_OPTIONS.Boxes),
        Type.Literal(CHILDREN_PAGES_LAYOUT_OPTIONS.Rows),
      ],
      {
        default: CHILDREN_PAGES_LAYOUT_OPTIONS.Rows,
        format: "childrenpages",
        title: "Layout",
      },
    ),
  },
  {
    description:
      "The child page component is used to display information about pages inside this folder",
    title: "Child pages",
  },
)

export interface ChildrenPagesProps extends Static<typeof ChildrenPagesSchema> {
  shouldLazyLoad?: boolean
  permalink: string
  site: IsomerSiteProps
  headingLevel: number
}
