import type { IsomerSiteProps } from "~/types"

// NOTE: not all props will be used even if we passed them in
// as we will override some of them with Isomer's configuration e.g. font-family
// Nevertheless, keeping them here for reference
export interface VicaWidgetProps {
  // UI Theme
  "app-id": string
  "app-name": string
  "app-icon"?: string
  "app-subtitle"?: string // configuration disabled (according to docs)
  "app-welcome-message"?: string
  "app-font-family"?: string
  "app-base-font-size"?: string
  // General Color
  "app-color"?: string
  "app-foreground-color1"?: string
  "app-background-color2"?: string
  "app-foreground-color2"?: string
  "app-canvas-background-color"?: string
  "app-button-border-color"?: string
  "app-quick-reply-button-background-color"?: string
  // Autocomplete
  "app-enable-auto-complete"?: boolean
  "app-auto-complete-background-color"?: string
  "app-auto-complete-foreground-color"?: string
  "app-auto-complete-hover-color"?: string
  "app-auto-complete-divider-color"?: string
  // Recommendations
  "app-enable-recommendations"?: boolean
  "app-recommendations-background-color"?: string
  "app-recommendations-foreground-color"?: string
  "app-recommendations-hover-color"?: string
  // UI Behaviours
  "app-orchestrator-timeout"?: number
  "app-alternate-copy-vault"?: string
  "app-auto-launch"?: boolean
  "app-launched-animation-iteration"?: number
  "app-disable-csat"?: boolean
  // Chatbot Behaviours
  "app-quick-launch-event"?: string
  "app-quick-launch-event-force-trigger"?: boolean
  "app-bot-response-trigger-event"?: string
  "app-environment-override"?: string
  "app-translation-languages"?: string
  "app-enable-hide-translation"?: boolean
}

export interface VicaProps extends VicaWidgetProps {
  site: IsomerSiteProps
}
