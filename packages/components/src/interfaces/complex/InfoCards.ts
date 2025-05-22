import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { NON_EMPTY_STRING_REGEX } from "~/utils"
import { LINK_HREF_PATTERN } from "~/utils/validation"
import { ARRAY_RADIO_FORMAT } from "../format"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const CARDS_WITHOUT_IMAGES = "cardsWithoutImages"
export const CARDS_WITH_IMAGES = "cardsWithImages"

const IMAGE_FIT = {
  Cover: "cover",
  Content: "contain",
} as const

const SingleCardNoImageSchema = Type.Object({
  title: Type.String({
    title: "Title",
    maxLength: 100,
  }),
  description: Type.Optional(
    Type.String({
      title: "Description",
      maxLength: 150,
    }),
  ),
  url: Type.Optional(
    Type.String({
      title: "Link destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
})

const SingleCardWithImageSchema = Type.Composite([
  SingleCardNoImageSchema,
  Type.Object({
    imageUrl: ImageSrcSchema,
    imageFit: Type.Optional(
      Type.Union(
        [
          Type.Literal(IMAGE_FIT.Cover, {
            title: "Default (recommended)",
          }),
          Type.Literal(IMAGE_FIT.Content, {
            title: "Resize image to fit",
          }),
        ],
        {
          default: IMAGE_FIT.Cover,
          title: "Image display",
          description: `Select "Resize image to fit" only if the image has a white background.`,
          format: ARRAY_RADIO_FORMAT,
        },
      ),
    ),
    imageAlt: AltTextSchema,
  }),
])

const InfoCardsBaseSchema = Type.Object({
  type: Type.Literal("infocards", { default: "infocards" }),
  id: Type.Optional(
    Type.String({
      title: "Anchor ID",
      description: "The ID to use for anchor links",
      format: "hidden",
    }),
  ),
  title: Type.String({
    title: "Title",
    maxLength: 100,
    pattern: NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
  subtitle: Type.Optional(
    Type.String({
      title: "Description",
      maxLength: 200,
    }),
  ),
  maxColumns: Type.Optional(
    Type.Union(
      [
        Type.Literal("1", { title: "1 column" }),
        Type.Literal("2", { title: "2 columns" }),
        Type.Literal("3", { title: "3 columns" }),
      ],
      {
        title: "Number of columns",
        description: "This only affects how the block appears on large screens",
        default: "3",
      },
    ),
  ),
  // TODO: Remove "label" and "url"
  // Context: This one is a stopgap measure in lieu of linking collections to the homepage
  // Will be hidden in Studio for now
  label: Type.Optional(
    Type.String({
      title: "Link text",
      maxLength: 50,
      description:
        "Add a link under your block. Avoid generic text such as “Click here” or “Learn more”",
      format: "hidden",
    }),
  ),
  url: Type.Optional(
    Type.String({
      title: "Link destination",
      description: "When this is clicked, open:",
      // should be link but needs to be hidden for now
      // shall not overcomlicate the schema for now since it's unavailable in Studio
      format: "hidden",
    }),
  ),
})

const InfoCardsWithImageSchema = Type.Object(
  {
    variant: Type.Literal(CARDS_WITH_IMAGES, { default: CARDS_WITH_IMAGES }),
    cards: Type.Array(SingleCardWithImageSchema, {
      title: "Cards",
      minItems: 1,
      maxItems: 30,
      default: [],
    }),
  },
  {
    title: "Cards with images",
  },
)

const InfoCardsNoImageSchema = Type.Object(
  {
    variant: Type.Literal(CARDS_WITHOUT_IMAGES, {
      default: CARDS_WITHOUT_IMAGES,
    }),
    cards: Type.Array(SingleCardNoImageSchema, {
      title: "Cards",
      minItems: 1,
      maxItems: 30,
      default: [],
    }),
  },
  {
    title: "Cards without images",
  },
)

export const InfoCardsSchema = Type.Intersect(
  [
    InfoCardsBaseSchema,
    Type.Union([InfoCardsWithImageSchema, InfoCardsNoImageSchema], {
      format: ARRAY_RADIO_FORMAT,
    }),
  ],
  {
    title: "Cards component",
  },
)

export type SingleCardNoImageProps = Static<typeof SingleCardNoImageSchema> & {
  site: IsomerSiteProps
  isExternalLink?: boolean
  LinkComponent?: LinkComponentType
}
export type SingleCardWithImageProps = Static<
  typeof SingleCardWithImageSchema
> &
  Pick<Static<typeof InfoCardsBaseSchema>, "maxColumns"> & {
    site: IsomerSiteProps
    layout: IsomerPageLayoutType
    isExternalLink?: boolean
    LinkComponent?: LinkComponentType
    shouldLazyLoad?: boolean
  }
export type InfoCardsProps = Static<typeof InfoCardsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
  shouldLazyLoad?: boolean
}
