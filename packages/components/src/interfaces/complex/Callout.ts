import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { ARRAY_RADIO_FORMAT } from "../format"
import { CalloutProseSchema } from "../native/Prose"

export const CalloutVariant = {
  Important: { value: "important", label: "Important information (Default)" },
  GoodNews: { value: "goodNews", label: "Good news" },
  Note: { value: "note", label: "Please note" },
  ActionNeeded: { value: "actionNeeded", label: "Action needed" },
  AdditionalInformation: {
    value: "additionalInformation",
    label: "Additional information",
  },
} as const

export const CalloutSchema = Type.Object(
  {
    type: Type.Literal("callout", { default: "callout" }),
    variant: Type.Optional(
      Type.Union(
        [
          Type.Literal(CalloutVariant.Important.value, {
            title: CalloutVariant.Important.label,
          }),
          Type.Literal(CalloutVariant.GoodNews.value, {
            title: CalloutVariant.GoodNews.label,
          }),
          Type.Literal(CalloutVariant.Note.value, {
            title: CalloutVariant.Note.label,
          }),
          Type.Literal(CalloutVariant.ActionNeeded.value, {
            title: CalloutVariant.ActionNeeded.label,
          }),
          Type.Literal(CalloutVariant.AdditionalInformation.value, {
            title: CalloutVariant.AdditionalInformation.label,
          }),
        ],
        {
          title: "You're communicating",
          default: CalloutVariant.Important.value,
          format: ARRAY_RADIO_FORMAT,
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
