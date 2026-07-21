import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { ARRAY_RADIO_FORMAT } from "../format"

export const BUTTON_VARIANT = {
  single: "single",
  pair: "pair",
} as const

export const BUTTON_ALIGNMENT = {
  left: "left",
  center: "center",
} as const

const ButtonBaseSchema = Type.Object({
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
})

const GROUPINGS = {
  PRIMARY_CALL_TO_ACTION: {
    label: "Primary call-to-action",
    fields: ["buttonLabel", "buttonUrl"],
  },
  SECONDARY_CALL_TO_ACTION: {
    label: "Secondary call-to-action",
    fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
  },
} as const

const SingleButtonSchema = Type.Object(
  {
    variant: Type.Literal(BUTTON_VARIANT.single, {
      default: BUTTON_VARIANT.single,
    }),
    buttonLabel: Type.String({
      title: "Button text",
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
  },
  {
    title: "Single button",
    groups: [GROUPINGS.PRIMARY_CALL_TO_ACTION],
  },
)

const PairButtonSchema = Type.Object(
  {
    variant: Type.Literal(BUTTON_VARIANT.pair, {
      default: BUTTON_VARIANT.pair,
    }),
    buttonLabel: Type.String({
      title: "Button text",
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
    secondaryButtonLabel: Type.String({
      title: "Button text",
      pattern: NON_EMPTY_STRING_REGEX,
      default: "Enter your button text.",
      errorMessage: {
        pattern: "cannot be empty or contain only spaces",
      },
    }),
    secondaryButtonUrl: Type.String({
      title: "Button destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
      default: "https://www.google.com",
    }),
  },
  {
    title: "Pair of buttons",
    groups: [
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
  },
)

export const ButtonSchema = Type.Intersect(
  [
    ButtonBaseSchema,
    // Use Type.Unsafe to generate oneOf (not anyOf) for AJV discriminator support
    // Type.Union generates anyOf which doesn't work with discriminator
    Type.Unsafe<
      Static<typeof SingleButtonSchema> | Static<typeof PairButtonSchema>
    >({
      oneOf: [SingleButtonSchema, PairButtonSchema],
      discriminator: { propertyName: "variant" },
      format: ARRAY_RADIO_FORMAT,
      title: "Style",
    }),
  ],
  {
    title: "Button",
  },
)

export type ButtonProps = Static<typeof ButtonSchema> & {
  site: IsomerSiteProps
}
