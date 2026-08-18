import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

// Accepts existing IDs such as `mha`, plus AskGov URLs with or without an
// HTTP(S) scheme, for example `https://ask.gov.sg/mha` and
// `www.ask.gov.sg/mha/questions/123`. The ID branch remains free-form but
// excludes URL-like values and all AskGov subdomains so only `ask.gov.sg` and
// `www.ask.gov.sg` can use the URL form. Root URLs without an ID are rejected.
const ASKGOV_DOMAIN_PATTERN = "(?:[A-Za-z0-9-]+\\.)*ask\\.gov\\.sg"
const ASKGOV_HOST_PATTERN = "(?:www\\.)?ask\\.gov\\.sg"
const ASKGOV_ID_OR_URL_PATTERN = `^(?:(?!${ASKGOV_DOMAIN_PATTERN}(?:[./?#]|$)|.*://).+|(?:https?://)?${ASKGOV_HOST_PATTERN}/[^/?#]+.*)$`

export const AskgovSchema = Type.Object(
  {
    "data-agency": Type.String({
      title: "AskGov ID",
      description:
        'This is what comes after ask.gov.sg. For example, for https://ask.gov.sg/help, "help" is the ID.',
      pattern: ASKGOV_ID_OR_URL_PATTERN,
      errorMessage: {
        pattern: "must be an ID or a valid ask.gov.sg URL",
      },
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
