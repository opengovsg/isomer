import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { ProcessedCollectionCardProps } from "~/interfaces/internal/CollectionCard"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { REF_INTERNAL_HREF_PATTERN } from "~/utils/validation"

export const COLLECTION_WIDGET_TYPE = "collectionwidget"

export const CollectionWidgetSchema = Type.Object(
  {
    type: Type.Literal(COLLECTION_WIDGET_TYPE, {
      default: COLLECTION_WIDGET_TYPE,
    }),
    collectionReferenceLink: Type.String({
      title: "Collection",
      description: "The collection to display pages from",
      format: "link",
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
        maxLength: 100,
      }),
    ),
    displayThumbnail: Type.Boolean({
      title: "Display thumbnail of all pages",
      default: true,
    }),
    displayCategory: Type.Boolean({
      title: "Display category",
      default: true,
    }),
    buttonLabel: Type.String({
      title: "Button text",
      maxLength: 50,
      description: "Clicking this button will open the main collection",
    }),
  },
  {
    title: "CollectionWidget component",
  },
)

export type CollectionWidgetProps = Static<typeof CollectionWidgetSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  shouldLazyLoad?: boolean
}

export type CollectionWidgetSingleCardProps = Pick<
  ProcessedCollectionCardProps,
  "title" | "image" | "category" | "referenceLinkHref" | "lastUpdated"
> &
  Pick<CollectionWidgetProps, "displayThumbnail" | "displayCategory"> & {
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
    shouldLazyLoad?: boolean
  }
