import type { IsomerSiteProps } from "~/types"

export interface WizgovProps {
  "data-agency": string
  "data-topic"?: string
}

export interface WizgovWidgetProps extends WizgovProps {
  environment: IsomerSiteProps["environment"]
}
