import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const SingleCardSchema = Type.Object({
  title: Type.String({
    title: "Title",
  }),
  description: Type.Optional(
    Type.String({
      title: "Description",
    }),
  ),
  buttonLabel: Type.Optional(
    Type.String({
      title: "Link text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  url: Type.String({
    title: "Link destination",
    description: "When this is clicked, open:",
  }),
  imageUrl: Type.String({
    title: "Upload image",
    format: "image",
  }),
  imageAlt: Type.String({
    title: "Alternate text",
    description:
      "Add a descriptive alternative text for this image. This helps visually impaired users to understand your image.",
  }),
})

export const InfoCardsSchema = Type.Object(
  {
    type: Type.Literal("infocards", { default: "infocards" }),
    title: Type.Optional(
      Type.String({
        title: "Title",
      }),
    ),
    subtitle: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    cards: Type.Array(SingleCardSchema, {
      title: "Cards",
      minItems: 1,
    }),
  },
  {
    title: "Infocards component",
  },
)

export type SingleCardProps = Static<typeof SingleCardSchema>
export type InfoCardsProps = Static<typeof InfoCardsSchema> & {
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
}
