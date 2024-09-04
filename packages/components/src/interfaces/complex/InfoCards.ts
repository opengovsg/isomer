import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

const SingleCardNoImageSchema = Type.Object({
  title: Type.String({
    title: "Title",
    default: "This is the title of the card",
  }),
  description: Type.Optional(
    Type.String({
      title: "Description",
      default: "This is an optional description for the card",
    }),
  ),
  url: Type.Optional(
    Type.String({
      title: "Link destination",
      description: "When this is clicked, open:",
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
  title: Type.Optional(
    Type.String({
      title: "Title",
      default: "This is an optional title of the Cards component",
    }),
  ),
  subtitle: Type.Optional(
    Type.String({
      title: "Description",
      default: "This is an optional description for the Cards component",
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
  LinkComponent?: any // Next.js link
}
export type SingleCardWithImageProps = Static<
  typeof SingleCardWithImageSchema
> & {
  LinkComponent?: any // Next.js link
}
export type InfoCardsProps = Static<typeof InfoCardsSchema> & {
  LinkComponent?: any // Next.js link
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
}
