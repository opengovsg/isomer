import { Type, type Static } from "@sinclair/typebox"

export const SingleCardSchema = Type.Object({
  title: Type.String({
    title: "Card title",
    description: "The title of the card",
  }),
  url: Type.String({
    title: "Card URL",
    description: "The URL that the card links to",
  }),
  imageUrl: Type.String({
    title: "Card image URL",
    description: "The URL of the image to display on the card",
  }),
  imageAlt: Type.String({
    title: "Card image alt text",
    description: "The alt text for the card image",
  }),
  description: Type.Optional(
    Type.String({
      title: "Card content",
      description: "The content of the card",
    }),
  ),
  buttonLabel: Type.Optional(
    Type.String({
      title: "Button label",
      description: "The label for the card button",
    }),
  ),
})

export const InfoCardsSchema = Type.Object(
  {
    type: Type.Literal("infocards"),
    // TODO: Remove this property, only used in classic theme
    sectionIdx: Type.Optional(Type.Number()),
    variant: Type.Union([Type.Literal("side"), Type.Literal("top")], {
      title: "Infocards variant",
      description: "The variant of the infocards component to use",
      format: "radio",
    }),
    title: Type.Optional(
      Type.String({
        title: "Infocards section title",
        description: "The title of the Infocards component",
      }),
    ),
    subtitle: Type.Optional(
      Type.String({
        title: "Infocards subtitle",
        description: "The subtitle of the Infocards component",
      }),
    ),
    cards: Type.Array(SingleCardSchema, {
      title: "Infocards cards",
      minItems: 1,
    }),
  },
  {
    title: "Infocards component",
  },
)

export type SingleCardProps = Static<typeof SingleCardSchema>
export type InfoCardsProps = Static<typeof InfoCardsSchema>
