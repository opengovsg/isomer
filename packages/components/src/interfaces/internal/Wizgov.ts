import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"

export const WizgovSchema = Type.Object(
  {
    "data-agency": Type.String({
      title: "Agency Identifier",
      description: "The agency identifier for Wizgov integration.",
    }),
    "data-topic": Type.Optional(
      Type.String({
        title: "Topic Identifier",
        description: "The topic identifier for Wizgov integration.",
      }),
    ),
  },
  {
    title: "Wizgov Widget",
    description: "Schema for the Wizgov widget integration.",
  },
)

export type WizgovProps = Static<typeof WizgovSchema>

export interface WizgovWidgetProps extends WizgovProps {
  environment: IsomerSiteProps["environment"]
}
