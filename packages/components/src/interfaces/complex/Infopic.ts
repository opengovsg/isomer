import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import { AltTextSchema, ImageSrcSchema } from "./Image"

export const InfopicVariants = {
  Block: {
    label: "Block (Default)",
    value: "block",
  },
  Full: {
    label: "Full-image",
    value: "full",
  },
} as const

export const InfopicSchema = Type.Object(
  {
    buttonLabel: Type.Optional(
      Type.String({
        description:
          "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
        maxLength: 50,
        title: "Button text",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
        title: "Button destination",
      }),
    ),
    description: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    id: Type.Optional(
      Type.String({
        description: "The ID to use for anchor links",
        format: "hidden",
        title: "Anchor ID",
      }),
    ),
    imageAlt: AltTextSchema,
    imageSrc: ImageSrcSchema,
    title: Type.String({
      title: "Title",
    }),
    type: Type.Literal("infopic", { default: "infopic" }),
    variant: Type.Optional(
      Type.Union(
        [
          Type.Literal(InfopicVariants.Block.value, {
            title: InfopicVariants.Block.label,
          }),
          Type.Literal(InfopicVariants.Full.value, {
            title: InfopicVariants.Full.label,
          }),
        ],
        {
          default: InfopicVariants.Block.value,
          format: "hidden",
          title: "Infopic style",
        },
      ),
    ),
  },
  {
    description:
      "The infopic component is used to display an image with accompanying text",
    title: "Image with text",
  },
)

export type InfopicProps = Static<typeof InfopicSchema> & {
  // NOTE: Remove this property, only used in classic theme
  sectionIndex?: number
  // Subtitle that is only used in the classic theme
  subtitle?: string
  // Automatically determined based on position in page
  isTextOnRight?: boolean
  shouldLazyLoad?: boolean
  site: IsomerSiteProps
  headingLevel: number
}
