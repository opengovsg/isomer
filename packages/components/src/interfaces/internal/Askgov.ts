import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"

export const AskgovSchema = Type.Object(
  {
    "data-agency": Type.String({
      title: "AskGov ID",
      description:
        'This is what comes after ask.gov.sg. For example, for https://ask.gov.sg/help, "help" is the ID.',
    }),
    "data-topic": Type.Optional(
      Type.String({
        title: "Topic Identifier",
        description: "The topic identifier for Askgov integration.",
        format: "hidden",
      }),
    ),
  },
  {
    title: "Askgov Widget",
    description: "Schema for the Askgov widget integration.",
    format: "widget-integration/askgov",
  },
)

export type AskgovProps = Static<typeof AskgovSchema>

export type AskgovWidgetProps = AskgovProps & {
  environment: IsomerSiteProps["environment"]
}
