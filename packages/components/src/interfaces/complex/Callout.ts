import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { CalloutProseSchema } from "../native/Prose"

export const CALLOUT_VARIANT_OPTIONS = {
  Information: "information",
  GoodToKnow: "goodToKnow",
  Warning: "warning",
  Urgent: "urgent",
  Note: "note",
} as const

export type CalloutVariant =
  (typeof CALLOUT_VARIANT_OPTIONS)[keyof typeof CALLOUT_VARIANT_OPTIONS]

export const DEFAULT_CALLOUT_VARIANT = CALLOUT_VARIANT_OPTIONS.Information

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout", { default: "callout" }),
    variant: Type.Optional(
      Type.Unsafe<CalloutVariant>({
        oneOf: [
          {
            const: CALLOUT_VARIANT_OPTIONS.Information,
            image: "callout/information",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.GoodToKnow,
            image: "callout/goodToKnow",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Warning,
            image: "callout/warning",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Urgent,
            image: "callout/urgent",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Note,
            image: "callout/note",
          },
        ],
        title: "Message type",
        default: DEFAULT_CALLOUT_VARIANT,
        format: "image-radio/1col",
      }),
    ),
    content: CalloutProseSchema,
  },
  {
    title: "Callout",
    description: "A component that highlights important information",
  },
)

export type CalloutProps = Static<typeof CalloutSchema> & {
  site: IsomerSiteProps
}
