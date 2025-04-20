import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { ProcessedCollectionCardProps } from "~/interfaces/internal/CollectionCard"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ARRAY_RADIO_FORMAT } from "~/interfaces"
import { REF_INTERNAL_HREF_PATTERN } from "~/utils/validation"

export const COLLECTION_WIDGET_TYPE = "collectionwidget"

const COLLECTION_WIDGET_NUMBER_OF_PAGES = {
  THREE: "3",
  SIX: "6",
} as const

export const DEFAULT_COLLECTION_WIDGET_NUMBER_OF_PAGES =
  COLLECTION_WIDGET_NUMBER_OF_PAGES.THREE

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
    numberOfPages: Type.Union(
      [
        Type.Literal(COLLECTION_WIDGET_NUMBER_OF_PAGES.THREE, {
          title: "3 pages",
        }),
        Type.Literal(COLLECTION_WIDGET_NUMBER_OF_PAGES.SIX, {
          title: "6 pages",
        }),
      ],
      {
        title: "Number of pages to display",
        default: DEFAULT_COLLECTION_WIDGET_NUMBER_OF_PAGES,
        format: ARRAY_RADIO_FORMAT,
      },
    ),
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
  "title" | "description" | "image" | "referenceLinkHref"
> &
  Pick<CollectionWidgetProps, "displayThumbnail" | "displayCategory"> & {
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
    shouldLazyLoad?: boolean
  }
