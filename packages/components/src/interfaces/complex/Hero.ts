import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"

const HeroHeadingSchema = Type.Object({
  title: Type.String({
    title: "Hero text",
    description: "The title of the hero banner",
    maxLength: 50,
  }),
  subtitle: Type.Optional(
    Type.String({
      title: "Description",
      description: "The contents of the hero banner",
      format: "textarea",
      maxLength: 250,
    }),
  ),
})

const HeroButtonsSchema = Type.Object({
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
      pattern: LINK_HREF_PATTERN,
    }),
  ),
  secondaryButtonLabel: Type.Optional(
    Type.String({
      title: "Button text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  secondaryButtonUrl: Type.Optional(
    Type.String({
      title: "Button destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
})

const HeroBackgroundImageSchema = Type.Object({
  backgroundUrl: Type.String({
    title: "Hero image",
    format: "image",
  }),
})

export const HeroSchema = Type.Composite(
  [
    HeroHeadingSchema,
    HeroButtonsSchema,
    HeroBackgroundImageSchema,
    Type.Object({
      type: Type.Literal("hero", { default: "hero" }),
      variant: Type.Union(
        [
          Type.Literal("gradient", { title: "Gradient" }),
          Type.Literal("block", { title: "Block" }),
        ],
        {
          default: "gradient",
          title: "Hero banner style",
        },
      ),
    }),
  ],
  {
    groups: [
      {
        label: "Primary call-to-action",
        fields: ["buttonLabel", "buttonUrl"],
      },
      {
        label: "Secondary call-to-action",
        fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
      },
      {
        label: "Image",
        fields: ["backgroundUrl"],
      },
    ],
    title: "Hero component",
    description:
      "The hero component is used to display a large banner at the top of the homepage.",
  },
)

export type HeroBackgroundImageProps = Static<typeof HeroBackgroundImageSchema>
export type HeroProps = Static<typeof HeroSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  theme?: "default" | "inverse"
}
