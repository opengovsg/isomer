import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { ProcessedCollectionCardProps } from "~/interfaces/internal/CollectionCard"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { COLLECTION_DROPDOWN_FORMAT } from "~/interfaces/format"
import { REF_INTERNAL_HREF_PATTERN } from "~/utils/validation"

export const COLLECTION_BLOCK_TYPE = "collectionblock"

export const CollectionBlockSchema = Type.Object(
  {
    type: Type.Literal(COLLECTION_BLOCK_TYPE, {
      default: COLLECTION_BLOCK_TYPE,
    }),
    collectionReferenceLink: Type.String({
      title: "Collection",
      description: "The collection to display pages from",
      format: COLLECTION_DROPDOWN_FORMAT,
      pattern: REF_INTERNAL_HREF_PATTERN,
    }),
    // TODO: Add the option to enable/disable the custom title and description as a whole
    // For now, we just assume that they will take effect if truthy
    customTitle: Type.Optional(
      Type.String({
        title: "Custom title",
        maxLength: 100,
      }),
    ),
    customDescription: Type.Optional(
      Type.String({
        title: "Custom description",
        maxLength: 200,
      }),
    ),
    displayThumbnail: Type.Boolean({
      title: "Display thumbnail of all pages",
      default: true,
    }),
    displayCategory: Type.Boolean({
      title: "Display category of all pages",
      default: true,
    }),
    buttonLabel: Type.String({
      title: "Button text",
      maxLength: 50,
      description:
        "Clicking this button will open the main collection. You can’t change its destination.",
    }),
    highlightedCategories: Type.Optional(
      Type.Array(
        Type.String({
          title: "Highlighted category",
        }),
        {
          title: "Highlighted categories",
          description:
            "The categories to highlight. If not provided, all collection pages will be displayed.",
          format: "hidden", // Only for selected agencies, as we should pull this from list of collection tags once that is available
        },
      ),
    ),
  },
  {
    title: "CollectionBlock component",
  },
)

export type CollectionBlockProps = Static<typeof CollectionBlockSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  shouldLazyLoad?: boolean
}

export type CollectionBlockSingleCardProps = Pick<
  ProcessedCollectionCardProps,
  "title" | "image" | "category" | "referenceLinkHref" | "date"
> &
  Pick<CollectionBlockProps, "displayThumbnail" | "displayCategory"> &
  CollectionBlockNumberOfCards & {
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
    shouldLazyLoad?: boolean
  }

export interface CollectionBlockNumberOfCards {
  numberOfCards: 1 | 2 | 3
}
