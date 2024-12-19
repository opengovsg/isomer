import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"

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
      maxLength: 120,
    }),
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
        title: "Maximum columns variant",
        description:
          "Controls the responsive behaviour regarding the number of columns that this component will expand to in different viewports",
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
    variant: Type.Literal("cardsWithImages", { default: "cardsWithImages" }),
    cards: Type.Array(SingleCardWithImageSchema, {
      title: "Cards",
      maxItems: 12,
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
      maxItems: 12,
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
  layout: IsomerPageLayoutType
  LinkComponent?: LinkComponentType
}
export type InfoCardsProps = Static<typeof InfoCardsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
}
