import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, ScriptComponentType } from "~/types"

export const AskgovSchema = Type.Object(
  {
    "data-agency": Type.String({
      title: "Agency Identifier",
      description: "The agency identifier for Askgov integration.",
    }),
    "data-topic": Type.Optional(
      Type.String({
        title: "Topic Identifier",
        description: "The topic identifier for Askgov integration.",
      }),
    ),
  },
  {
    title: "Askgov Widget",
    description: "Schema for the Askgov widget integration.",
  },
)

export type AskgovProps = Static<typeof AskgovSchema>

export interface AskgovWidgetProps extends AskgovProps {
  environment: IsomerSiteProps["environment"]
  ScriptComponent?: ScriptComponentType
}
