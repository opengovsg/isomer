import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { CalloutProseSchema } from "../native/Prose"

const CALLOUT_VARIANT_OPTIONS = {
  Info: "info",
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
            title: "Information",
            image: "callout/information",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.GoodToKnow,
            title: "Good to know",
            image: "callout/goodToKnow",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Warning,
            title: "Warning",
            image: "callout/warning",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Urgent,
            title: "Urgent",
            image: "callout/urgent",
          },
          {
            const: CALLOUT_VARIANT_OPTIONS.Note,
            title: "Note",
            image: "callout/note",
          },
        ],
        title: "Message type",
        // NOTE: intentionally no `default` here — Studio runs AJV with
        // `useDefaults: true`, which would write the default into existing
        // pages on open and mark them dirty. The renderer and the image-radio
        // control both fall back to the first option for display instead.
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
  headingLevel: number
}
