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
  SingleCardNoImageSchema,
  Type.Object({
    imageUrl: Type.String({
      title: "Upload image",
      format: "image",
    }),
    imageAlt: Type.String({
      title: "Alternate text",
      description:
        "Add a descriptive alternative text for this image. This helps visually impaired users to understand your image.",
    }),
  }),
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
})

const InfoCardsWithImageSchema = Type.Object(
  {
    isCardsWithImages: Type.Literal(true, { default: true }),
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
    isCardsWithImages: Type.Literal(false, { default: false }),
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
