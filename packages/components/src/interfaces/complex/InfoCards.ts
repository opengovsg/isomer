import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"

const SingleCardNoImageSchema = Type.Object({
  title: Type.String({
    title: "Title",
    default: "This is the title of the card",
    maxLength: 100,
  }),
  description: Type.Optional(
    Type.String({
      title: "Description",
      default: "This is an optional description for the card",
      maxLength: 200,
    }),
  ),
  url: Type.Optional(
    Type.String({
      title: "Link destination",
      description: "When this is clicked, open:",
      format: "link",
    }),
  ),
})

const SingleCardWithImageSchema = Type.Composite([
  Type.Object({
    imageUrl: Type.String({
      title: "Upload image",
      format: "image",
    }),
    imageFit: Type.Optional(
      Type.Union(
        [
          Type.Literal("cover", {
            title: "Default (recommended)",
          }),
          Type.Literal("contain", {
            title: "Resize image to fit",
          }),
        ],
        {
          default: "cover",
          title: "Image display",
          description: `Select "Resize image to fit" only if the image has a white background.`,
        },
      ),
    ),
    imageAlt: Type.String({
      title: "Alternate text",
      description:
        "Add a descriptive alternative text for this image. This helps visually impaired users to understand your image.",
    }),
  }),
  SingleCardNoImageSchema,
])

const InfoCardsBaseSchema = Type.Object({
  type: Type.Literal("infocards", { default: "infocards" }),
  title: Type.String({
    title: "Title",
    default: "This is an optional title of the Cards component",
    maxLength: 100,
  }),
  subtitle: Type.Optional(
    Type.String({
      title: "Description",
      default: "This is an optional description for the Cards component",
      maxLength: 100,
    }),
  ),
  maxColumns: Type.Optional(
    Type.Union([Type.Literal(1), Type.Literal(2), Type.Literal(3)], {
      title: "Maximum columns variant",
      description:
        "Controls the responsive behaviour regarding the number of columns that this component will expand to in different viewports",
    }),
  ),
})

const InfoCardsWithImageSchema = Type.Object(
  {
    variant: Type.Literal("cardsWithImages", { default: "cardsWithImages" }),
    cards: Type.Array(SingleCardWithImageSchema, {
      title: "Cards",
      default: [],
    }),
  },
  {
    title: "Cards with images",
  },
)

const InfoCardsNoImageSchema = Type.Object(
  {
    variant: Type.Literal("cardsWithoutImages", {
      default: "cardsWithoutImages",
    }),
    cards: Type.Array(SingleCardNoImageSchema, {
      title: "Cards",
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
    Type.Union([InfoCardsWithImageSchema, InfoCardsNoImageSchema]),
  ],
  {
    title: "Cards component",
  },
)

export type SingleCardNoImageProps = Static<typeof SingleCardNoImageSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
export type SingleCardWithImageProps = Static<
  typeof SingleCardWithImageSchema
> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
export type InfoCardsProps = Static<typeof InfoCardsSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
}
