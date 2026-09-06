import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { InfoCardsImageFitSchema } from "~/schemas/internal"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { ARRAY_RADIO_FORMAT } from "../format"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const CARDS_WITHOUT_IMAGES = "cardsWithoutImages"
export const CARDS_WITH_IMAGES = "cardsWithImages"
export const CARDS_WITH_FULL_IMAGES = "cardsWithFullImages"

export const INFOCARD_VARIANT = {
  bold: "bold",
  default: "default",
} as const

type InfoCardVariants = keyof typeof INFOCARD_VARIANT

const SingleCardNoImageSchema = Type.Object({
  description: Type.Optional(
    Type.String({
      description:
        "To make sure your description is readable, keep it under 150 characters.",
      title: "Description",
    }),
  ),
  title: Type.String({
    title: "Title",
  }),
  url: Type.Optional(
    Type.String({
      description: "When this is clicked, open:",
      format: "prefill-link",
      pattern: LINK_HREF_PATTERN,
      title: "Link destination",
    }),
  ),
})

const SingleCardWithImageSchema = Type.Composite([
  SingleCardNoImageSchema,
  Type.Object({
    imageAlt: AltTextSchema,
    imageFit: Type.Optional(InfoCardsImageFitSchema),
    imageUrl: ImageSrcSchema,
  }),
])

const InfoCardsBaseSchema = Type.Object({
  id: Type.Optional(
    Type.String({
      description: "The ID to use for anchor links",
      format: "hidden",
      title: "Anchor ID",
    }),
  ),
  // NOTE: Remove "label" and "url"
  // Context: This one is a stopgap measure in lieu of linking collections to the homepage
  // Will be hidden in Studio for now
  label: Type.Optional(
    Type.String({
      description:
        "Add a link under your block. Avoid generic text such as “Click here” or “Learn more”",
      format: "hidden",
      maxLength: 50,
      title: "Link text",
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
        default: "3",
        description: "This only affects how the block appears on large screens",
        title: "Number of columns",
      },
    ),
  ),
  subtitle: Type.Optional(
    Type.String({
      title: "Description",
    }),
  ),
  title: Type.String({
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
    pattern: NON_EMPTY_STRING_REGEX,
    title: "Title",
  }),
  type: Type.Literal("infocards", { default: "infocards" }),
  url: Type.Optional(
    Type.String({
      description: "When this is clicked, open:",
      // should be link but needs to be hidden for now
      // shall not overcomlicate the schema for now since it's unavailable in Studio
      format: "hidden",
      title: "Link destination",
    }),
  ),
})

const InfoCardsWithImageSchema = Type.Object(
  {
    cards: Type.Array(SingleCardWithImageSchema, {
      default: [],
      maxItems: 30,
      minItems: 1,
      title: "Cards",
    }),
    variant: Type.Literal(CARDS_WITH_IMAGES, { default: CARDS_WITH_IMAGES }),
  },
  {
    title: "Cards with images",
  },
)

const InfoCardsWithFullImageSchema = Type.Object(
  {
    cards: Type.Array(Type.Omit(SingleCardWithImageSchema, ["description"]), {
      default: [],
      maxItems: 30,
      minItems: 1,
      title: "Cards",
    }),
    variant: Type.Literal(CARDS_WITH_FULL_IMAGES, {
      default: CARDS_WITH_FULL_IMAGES,
    }),
  },
  {
    title: "Cards with full images",
  },
)

const InfoCardsNoImageSchema = Type.Object(
  {
    cards: Type.Array(SingleCardNoImageSchema, {
      default: [],
      maxItems: 30,
      minItems: 1,
      title: "Cards",
    }),
    variant: Type.Literal(CARDS_WITHOUT_IMAGES, {
      default: CARDS_WITHOUT_IMAGES,
    }),
  },
  {
    title: "Cards without images",
  },
)

export const InfoCardsSchema = Type.Intersect(
  [
    InfoCardsBaseSchema,
    // Use Type.Unsafe to generate oneOf (not anyOf) for AJV discriminator support
    // Type.Union generates anyOf which doesn't work with discriminator
    Type.Unsafe<
      | Static<typeof InfoCardsWithImageSchema>
      | Static<typeof InfoCardsNoImageSchema>
      | Static<typeof InfoCardsWithFullImageSchema>
    >({
      discriminator: { propertyName: "variant" },
      format: ARRAY_RADIO_FORMAT,
      oneOf: [
        InfoCardsWithImageSchema,
        InfoCardsNoImageSchema,
        InfoCardsWithFullImageSchema,
      ],
      title: "Style",
    }),
  ],
  {
    title: "Cards",
  },
)

export type SingleCardNoImageProps = Static<typeof SingleCardNoImageSchema> & {
  site: IsomerSiteProps
  isExternalLink?: boolean
  headingLevel: number
}
export type SingleCardWithImageProps = Static<
  typeof SingleCardWithImageSchema
> &
  Pick<Static<typeof InfoCardsBaseSchema>, "maxColumns"> & {
    site: IsomerSiteProps
    layout: IsomerPageLayoutType
    isExternalLink?: boolean
    shouldLazyLoad?: boolean
    variant?: InfoCardVariants
    isFallback?: boolean
    headingLevel: number
  }
export type InfoCardsProps = Static<typeof InfoCardsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  // NOTE: Remove this property, only used in classic theme
  sectionIdx?: number
  shouldLazyLoad?: boolean
  headingLevel: number
}
