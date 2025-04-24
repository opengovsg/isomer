import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { ProcessedCollectionCardProps } from "~/interfaces/internal/CollectionCard"
import type {
  BasePageAdditionalProps,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
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
        maxLength: 150,
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
  },
  {
    title: "CollectionBlock component",
  },
)

export interface CollectionBlockStudioProps {
  studioProps?: {
    title: string
    description: string
    card: {
      title: string
      category: string
      image: SelectedCollectionCardProps["image"]
      lastUpdated: string
      referenceLinkHref: string
    }
  }
}

export type CollectionBlockProps = Static<typeof CollectionBlockSchema> &
  CollectionBlockStudioProps & {
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
    shouldLazyLoad?: boolean
  }

type SelectedCollectionCardProps = Pick<
  ProcessedCollectionCardProps,
  "title" | "image" | "category" | "referenceLinkHref" | "lastUpdated"
>

export type CollectionBlockDisplayProps = Pick<
  CollectionBlockProps,
  | "site"
  | "LinkComponent"
  | "collectionReferenceLink"
  | "displayThumbnail"
  | "displayCategory"
  | "buttonLabel"
  | "shouldLazyLoad"
> & {
  title: CollectionBlockProps["customTitle"]
  description: CollectionBlockProps["customDescription"]
  collectionCards: SelectedCollectionCardProps[]
}

export type CollectionBlockSingleCardProps = SelectedCollectionCardProps &
  Pick<CollectionBlockProps, "displayThumbnail" | "displayCategory"> &
  CollectionBlockNumberOfCards & {
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
    shouldLazyLoad?: boolean
  }

export interface CollectionBlockNumberOfCards {
  numberOfCards: 1 | 2 | 3
}
