import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { CALLOUT_VARIANT_FORMAT } from "../format"
import { CalloutProseSchema } from "../native/Prose"

export const CalloutVariant = {
  information: "Important information (default)",
  goodToKnow: "Positive update",
  warning: "Warning",
  urgent: "Needs urgent action",
  note: "Did you know",
} as const

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout", { default: "callout" }),
    variant: Type.Optional(
      Type.Union(
        [
          Type.Literal("information", {
            title: CalloutVariant.information,
          }),
          Type.Literal("goodToKnow", {
            title: CalloutVariant.goodToKnow,
          }),
          Type.Literal("warning", {
            title: CalloutVariant.warning,
          }),
          Type.Literal("urgent", {
            title: CalloutVariant.urgent,
          }),
          Type.Literal("note", {
            title: CalloutVariant.note,
          }),
        ],
        {
          title: "Message type",
          default: "information",
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
