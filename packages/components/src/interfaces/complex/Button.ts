import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { ARRAY_RADIO_FORMAT } from "../format"

export const BUTTON_ALIGNMENT = {
  center: "center",
  left: "left",
} as const

export const ButtonSchema = Type.Object(
  {
    alignment: Type.Union(
      [
        Type.Literal(BUTTON_ALIGNMENT.left, { title: "Align left" }),
        Type.Literal(BUTTON_ALIGNMENT.center, { title: "Align centre" }),
      ],
      {
        default: BUTTON_ALIGNMENT.left,
        description:
          "Align centre spans the whole button group across the centre of the page container.",
        format: ARRAY_RADIO_FORMAT,
        title: "Alignment",
      },
    ),
    buttonLabel: Type.String({
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      errorMessage: {
        pattern: "cannot be empty or contain only spaces",
      },
      maxLength: 50,
      pattern: NON_EMPTY_STRING_REGEX,
      title: "Button text",
    }),
    buttonUrl: Type.String({
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
      title: "Button destination",
    }),
    secondaryButtonLabel: Type.Optional(
      Type.String({
        description:
          "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
        errorMessage: {
          pattern: "cannot be empty or contain only spaces",
        },
        maxLength: 50,
        pattern: NON_EMPTY_STRING_REGEX,
        title: "Secondary button text",
      }),
    ),
    secondaryButtonUrl: Type.Optional(
      Type.String({
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
        title: "Secondary button destination",
      }),
    ),
    type: Type.Literal("button", { default: "button" }),
  },
  {
    groups: [
      {
        fields: ["buttonLabel", "buttonUrl"],
        label: "Primary call-to-action",
      },
      {
        fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
        label: "Secondary call-to-action",
      },
    ],
    title: "Button",
  },
)

export type ButtonProps = Static<typeof ButtonSchema> & {
  site: IsomerSiteProps
}
