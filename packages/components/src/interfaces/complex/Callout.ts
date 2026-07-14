import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { CALLOUT_VARIANT_FORMAT } from "../format"
import { CalloutProseSchema } from "../native/Prose"

export const CalloutVariant = {
  Information: { value: "information", label: "Information (Default)" },
  GoodToKnow: { value: "goodToKnow", label: "Good to know" },
  Warning: { value: "warning", label: "Warning" },
  Urgent: { value: "urgent", label: "Urgent" },
  Note: { value: "note", label: "Note" },
} as const

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout", { default: "callout" }),
    variant: Type.Optional(
      Type.Union(
        [
          Type.Literal(CalloutVariant.Information.value, {
            title: CalloutVariant.Information.label,
          }),
          Type.Literal(CalloutVariant.GoodToKnow.value, {
            title: CalloutVariant.GoodToKnow.label,
          }),
          Type.Literal(CalloutVariant.Warning.value, {
            title: CalloutVariant.Warning.label,
          }),
          Type.Literal(CalloutVariant.Urgent.value, {
            title: CalloutVariant.Urgent.label,
          }),
          Type.Literal(CalloutVariant.Note.value, {
            title: CalloutVariant.Note.label,
          }),
        ],
        {
          title: "Message type",
          default: CalloutVariant.Information.value,
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
