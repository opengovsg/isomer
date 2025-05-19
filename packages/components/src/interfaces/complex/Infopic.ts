import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const InfopicVariants = {
  Block: {
    value: "block",
    label: "Block (Default)",
  },
  Full: {
    value: "full",
    label: "Full-image",
  },
} as const

export const InfopicSchema = Type.Object(
  {
    type: Type.Literal("infopic", { default: "infopic" }),
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
    description: Type.Optional(
      Type.String({
        title: "Description",
        maxLength: 200,
      }),
    ),
    buttonLabel: Type.Optional(
      Type.String({
        title: "Button text",
        maxLength: 50,
        description:
          "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        title: "Button destination",
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
      }),
    ),
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
        { title: "Infopic style", default: InfopicVariants.Block.value },
      ),
    ),
    imageSrc: ImageSrcSchema,
    imageAlt: Type.Optional(AltTextSchema),
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
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
