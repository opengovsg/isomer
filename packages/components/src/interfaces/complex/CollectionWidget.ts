import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ARRAY_RADIO_FORMAT } from "~/interfaces"
import { REF_INTERNAL_HREF_PATTERN } from "~/utils/validation"

export const COLLECTION_WIDGET_TYPE = "collectionwidget"

export const CollectionWidgetSchema = Type.Object(
  {
    type: Type.Literal(COLLECTION_WIDGET_TYPE, {
      default: COLLECTION_WIDGET_TYPE,
    }),
    collectionId: Type.String({
      title: "Collection ID",
      description: "The ID of the collection to display",
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
    buttonLabel: Type.String({
      title: "Button text",
      maxLength: 50,
      description: "Clicking this button will open the main collection",
    }),
    numberOfPages: Type.Union(
      [
        Type.Literal("3", { title: "3 pages" }),
        Type.Literal("6", { title: "6 pages" }),
      ],
      {
        title: "Number of pages to display",
        default: "3",
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
}
