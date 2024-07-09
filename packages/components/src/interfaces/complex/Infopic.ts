import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const InfopicSchema = Type.Object(
  {
    type: Type.Literal("infopic", { default: "infopic" }),
    // TODO: Remove this property, only used in classic theme
    sectionIndex: Type.Optional(Type.Number()),
    title: Type.String({
      title: "Infopic title",
      description: "The title of the Infopic component",
    }),
    subtitle: Type.Optional(
      Type.String({
        title: "Infopic subtitle",
        description: "The subtitle of the Infopic component",
      }),
    ),
    description: Type.Optional(
      Type.String({
        title: "Infopic description",
        description: "The content of the Infopic component",
      }),
    ),
    imageSrc: Type.String({
      title: "Infopic image URL",
      description: "The URL to the image",
    }),
    imageAlt: Type.Optional(
      Type.String({
        title: "Infopic image alt text",
        description: "The alt text for the image",
      }),
    ),
    buttonLabel: Type.Optional(
      Type.String({
        title: "Infopic button label",
        description: "The label of the button to display",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        title: "Infopic button URL",
        description: "The URL the button should navigate to",
      }),
    ),
    isTextOnRight: Type.Optional(
      Type.Boolean({
        title: "Infopic text on the right",
        description: "Whether to display the text on the right of the image",
      }),
    ),
    variant: Type.Optional(
      Type.Union([Type.Literal("side-by-side"), Type.Literal("side-part")], {
        title: "Infopic variant",
        description: "The variant of the infopic to use",
        type: "string",
      }),
    ),
  },
  {
    title: "Infopic component",
    description:
      "The infopic component is used to display an image with accompanying text",
  },
)

export type InfopicProps = Static<typeof InfopicSchema>
