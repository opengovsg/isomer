import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, ScriptComponentType } from "~/types"

export const AskgovSchema = Type.Object(
  {
    "data-agency": Type.String({
      title: "AskGov ID",
      description:
        "Find your AskGov ID at the end of your AskGov agency URL (e.g. https://ask.gov.sg/ogp → ID is 'ogp'). For help, see [How to set up AskGov widget on my website?](https://ask.gov.sg/help/questions/cmeb54o2q00t98tmo9zv8au0w).",
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
