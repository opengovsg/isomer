import type { IsomerSiteProps, ScriptComponentType } from "~/types"

export interface WizgovProps {
  "data-agency": string
}

export interface WizgovWidgetProps extends WizgovProps {
  environment: IsomerSiteProps["environment"]
  ScriptComponent?: ScriptComponentType
}
