import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, ScriptComponentType } from "~/types"

export const AskgovSchema = Type.Object(
  {
    "data-agency": Type.String({
      title: "AskGov ID",
      description:
        "You can get this from [AskGov support](https://form.gov.sg/689d8bf8bd05b72ca8a21d6b) after onboarding. If the widget doesn’t appear on your site, check that you have the correct ID.",
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

export interface AskgovWidgetProps extends AskgovProps {
  environment: IsomerSiteProps["environment"]
  ScriptComponent: ScriptComponentType
}
