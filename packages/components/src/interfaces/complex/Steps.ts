import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

type StepsNumberStyle = "numeral" | "eyebrow" | "badge"

const StepSchema = Type.Object({
  title: Type.String({
    title: "Step title",
  }),
  description: Type.Optional(
    Type.String({
      title: "Description",
      description: "Keep to 1–2 sentences so steps stay scannable.",
    }),
  ),
  buttonLabel: Type.Optional(
    Type.String({
      title: "Link text",
      maxLength: 50,
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      title: "Link destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
})

export const StepsSchema = Type.Object(
  {
    type: Type.Literal("steps", { default: "steps" }),
    id: Type.Optional(
      Type.String({
        title: "Anchor ID",
        description: "The ID to use for anchor links",
        format: "hidden",
      }),
    ),
    title: Type.String({
      title: "Title",
    }),
    subtitle: Type.Optional(
      Type.String({
        title: "Description",
      }),
    ),
    // `numeral` is a bare number with no container; `eyebrow` and `badge` both
    // sit in a bordered card and differ in how the number itself is set.
    // `image` keys map to preview SVGs registered in Studio's image-radio
    // control, so authors pick by looking rather than by reading a label.
    numberStyle: Type.Unsafe<StepsNumberStyle>({
      oneOf: [
        {
          const: "numeral",
          title: "Large number",
          image: "steps/numeral",
        },
        {
          const: "eyebrow",
          title: "Small number above title",
          image: "steps/eyebrow",
        },
        {
          const: "badge",
          title: "Number in a filled square",
          image: "steps/badge",
        },
      ],
      title: "Number style",
      default: "numeral",
      format: "image-radio/1col",
    }),
    steps: Type.Array(StepSchema, {
      title: "Steps",
      minItems: 2,
      maxItems: 6,
    }),
  },
  {
    title: "Steps",
    description: "A component that displays a sequence of numbered steps",
  },
)

export type StepsProps = Static<typeof StepsSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  headingLevel: number
}
