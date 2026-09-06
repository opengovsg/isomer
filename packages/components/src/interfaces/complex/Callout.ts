import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { CalloutProseSchema } from "../native/Prose"

const CALLOUT_VARIANT_OPTIONS = {
  GoodToKnow: "goodToKnow",
  Info: "info",
  Information: "information",
  Note: "note",
  Urgent: "urgent",
  Warning: "warning",
} as const

export type CalloutVariant =
  (typeof CALLOUT_VARIANT_OPTIONS)[keyof typeof CALLOUT_VARIANT_OPTIONS]

export const DEFAULT_CALLOUT_VARIANT = CALLOUT_VARIANT_OPTIONS.Information

export const CalloutSchema = Type.Object(
  {
    content: CalloutProseSchema,
    type: Type.Literal("callout", { default: "callout" }),
    variant: Type.Optional(
      Type.Unsafe<CalloutVariant>({
        format: "image-radio/1col",
        oneOf: [
          {
            const: CALLOUT_VARIANT_OPTIONS.Information,
            image: "callout/information",
            title: "Information",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.GoodToKnow,
            image: "callout/goodToKnow",
            title: "Good to know",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Warning,
            image: "callout/warning",
            title: "Warning",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Urgent,
            image: "callout/urgent",
            title: "Urgent",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Note,
            image: "callout/note",
            title: "Note",
          },
        ],
        // NOTE: intentionally no `default` here — Studio runs AJV with
        // `useDefaults: true`, which would write the default into existing
        // pages on open and mark them dirty. The renderer and the image-radio
        // control both fall back to the first option for display instead.
        title: "Message type",
      }),
    ),
  },
  {
    description: "A component that highlights important information",
    title: "Callout",
  },
)

export type CalloutProps = Static<typeof CalloutSchema> & {
  site: IsomerSiteProps
  headingLevel: number
}
