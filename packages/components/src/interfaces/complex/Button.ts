import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { ARRAY_RADIO_FORMAT } from "../format"

export const BUTTON_ALIGNMENT = {
  left: "left",
  center: "center",
} as const

export const ButtonSchema = Type.Object(
  {
    type: Type.Literal("button", { default: "button" }),
    alignment: Type.Union(
      [
        Type.Literal(BUTTON_ALIGNMENT.left, { title: "Align left" }),
        Type.Literal(BUTTON_ALIGNMENT.center, { title: "Align centre" }),
      ],
      {
        title: "Alignment",
        description:
          "Align centre spans the whole button group across the centre of the page container.",
        default: BUTTON_ALIGNMENT.left,
        format: ARRAY_RADIO_FORMAT,
      },
    ),
    buttonLabel: Type.String({
      title: "Button text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      maxLength: 50,
      pattern: NON_EMPTY_STRING_REGEX,
      default: "Enter your button text.",
      errorMessage: {
        pattern: "cannot be empty or contain only spaces",
      },
    }),
    buttonUrl: Type.String({
      title: "Button destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
      default: "https://www.google.com",
    }),
    secondaryButtonLabel: Type.Optional(
      Type.String({
        title: "Secondary button text",
        description:
          "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
        maxLength: 50,
      }),
    ),
    secondaryButtonUrl: Type.Optional(
      Type.String({
        title: "Secondary button destination",
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
      }),
    ),
  },
  {
    title: "Button",
    groups: [
      {
        label: "Primary call-to-action",
        fields: ["buttonLabel", "buttonUrl"],
      },
      {
        label: "Secondary call-to-action",
        fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
      },
    ],
  },
)

export type ButtonProps = Static<typeof ButtonSchema> & {
  site: IsomerSiteProps
}
