import type { IsomerSiteProps } from "~/types"

export interface AskgovProps {
  "data-agency": string
  "data-topic"?: string
}

export interface AskgovWidgetProps extends AskgovProps {
  environment: IsomerSiteProps["environment"]
}
