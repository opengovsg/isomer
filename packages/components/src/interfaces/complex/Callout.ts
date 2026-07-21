import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { CALLOUT_VARIANT_FORMAT } from "../format"
import { CalloutProseSchema } from "../native/Prose"

export const DEFAULT_CALLOUT_VARIANT = "information"

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout", { default: "callout" }),
    variant: Type.Optional(
      Type.Union(
        [
          Type.Literal("information", { title: "Important information" }),
          Type.Literal("goodToKnow", { title: "Positive update" }),
          Type.Literal("warning", { title: "Warning" }),
          Type.Literal("urgent", { title: "Needs urgent action" }),
          Type.Literal("note", { title: "Did you know" }),
        ],
        {
          title: "Message type",
          default: DEFAULT_CALLOUT_VARIANT,
          format: CALLOUT_VARIANT_FORMAT,
        },
      ),
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

export type CalloutVariant = NonNullable<CalloutProps["variant"]>
