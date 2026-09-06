import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { ASKGOV_ID_OR_URL_REGEX } from "~/utils/validation"

export const AskgovSchema = Type.Object(
  {
    "data-agency": Type.String({
      description:
        'This is what comes after ask.gov.sg. For example, for https://ask.gov.sg/help, "help" is the ID.',
      errorMessage: {
        pattern: "must be an ID or a valid ask.gov.sg URL",
      },
      pattern: ASKGOV_ID_OR_URL_REGEX,
      title: "AskGov ID",
    }),
    "data-topic": Type.Optional(
      Type.String({
        description: "The topic identifier for Askgov integration.",
        format: "hidden",
        title: "Topic Identifier",
      }),
    ),
  },
  {
    description: "Schema for the Askgov widget integration.",
    format: "widget-integration/askgov",
    title: "Askgov Widget",
  },
)

export type AskgovProps = Static<typeof AskgovSchema>

export type AskgovWidgetProps = AskgovProps & {
  environment: IsomerSiteProps["environment"]
}
