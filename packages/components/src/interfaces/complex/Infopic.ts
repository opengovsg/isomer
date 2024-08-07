import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const InfopicSchema = Type.Object(
  {
    type: Type.Literal("infopic", { default: "infopic" }),
    title: Type.String({
      title: "Title",
    }),
    description: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    imageSrc: Type.String({
      title: "Upload image",
      description: "The URL to the image",
      format: "image",
    }),
    imageAlt: Type.Optional(
      Type.String({
        title: "Alternate text",
        description:
          "Add a descriptive alternative text for this image. This helps visually impaired users to understand your image.",
      }),
    ),
    buttonLabel: Type.Optional(
      Type.String({
        title: "Button text",
        description:
          "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        title: "Button destination",
        description: "When this is clicked, open:",
        format: "link",
      }),
    ),
  },
  {
    title: "Infopic component",
    description:
      "The infopic component is used to display an image with accompanying text",
  },
)

export type InfopicProps = Static<typeof InfopicSchema> & {
  sectionIndex?: number // TODO: Remove this property, only used in classic theme
  subtitle?: string // Subtitle that is only used in the classic theme
  isTextOnRight?: boolean // Automatically determined based on position in page
  LinkComponent?: any // Next.js link
}
