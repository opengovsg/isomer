import type { IsomerSiteProps } from "~/types"

export interface WizgovProps {
  "data-agency": string
}

export interface WizgovWidgetProps extends WizgovProps {
  environment: IsomerSiteProps["environment"]
}

export interface WizgovWidgetClientProps extends WizgovProps {
  scriptUrl: string
}
