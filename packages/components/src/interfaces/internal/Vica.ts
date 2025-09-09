import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, ScriptComponentType } from "~/types"

// We can only pass in string values to the Vica script
// as React omit boolean props when spreading onto a DOM element,
// so they won't appear as attributes in the rendered HTML.
const BooleanStringOptions = Type.Union([
  Type.Literal("true"),
  Type.Literal("false"),
])

// NOTE: not all props will be used even if we passed them in
// as we will override some of them with Isomer's configuration e.g. font-family
// Nevertheless, keeping them here for reference
export const VicaSchema = Type.Object({
  // UI Theme
  "app-id": Type.String(),
  "app-name": Type.String(),
  "app-icon": Type.Optional(Type.String()),
  "app-subtitle": Type.Optional(Type.String()), // configuration disabled (according to docs)
  "app-welcome-message": Type.Optional(Type.String()),
  "app-font-family": Type.Optional(Type.String()),
  "app-base-font-size": Type.Optional(Type.String()),
  // General Color
  "app-color": Type.Optional(Type.String()),
  "app-foreground-color1": Type.Optional(Type.String()),
  "app-background-color2": Type.Optional(Type.String()),
  "app-foreground-color2": Type.Optional(Type.String()),
  "app-canvas-background-color": Type.Optional(Type.String()),
  "app-button-border-color": Type.Optional(Type.String()),
  "app-quick-reply-button-background-color": Type.Optional(Type.String()),
  // Autocomplete
  "app-enable-auto-complete": Type.Optional(BooleanStringOptions),
  "app-auto-complete-background-color": Type.Optional(Type.String()),
  "app-auto-complete-foreground-color": Type.Optional(Type.String()),
  "app-auto-complete-hover-color": Type.Optional(Type.String()),
  "app-auto-complete-divider-color": Type.Optional(Type.String()),
  // Recommendations
  "app-enable-recommendations": Type.Optional(BooleanStringOptions),
  "app-recommendations-background-color": Type.Optional(Type.String()),
  "app-recommendations-foreground-color": Type.Optional(Type.String()),
  "app-recommendations-hover-color": Type.Optional(Type.String()),
  // UI Behaviours
  "app-orchestrator-timeout": Type.Optional(Type.Number()),
  "app-alternate-copy-vault": Type.Optional(Type.String()),
  "app-auto-launch": Type.Optional(BooleanStringOptions),
  "app-launched-animation-iteration": Type.Optional(Type.Number()),
  "app-disable-csat": Type.Optional(BooleanStringOptions),
  // Chatbot Behaviours
  "app-quick-launch-event": Type.Optional(Type.String()),
  "app-quick-launch-event-force-trigger": Type.Optional(BooleanStringOptions),
  "app-bot-response-trigger-event": Type.Optional(Type.String()),
  "app-environment-override": Type.Optional(Type.String()),
  "app-translation-languages": Type.Optional(Type.String()),
  "app-enable-hide-translation": Type.Optional(BooleanStringOptions),
})

export type VicaProps = Static<typeof VicaSchema>

export interface VicaWidgetClientProps extends VicaProps {
  environment: IsomerSiteProps["environment"]
  ScriptComponent?: ScriptComponentType
}

export interface VicaWidgetProps extends VicaProps {
  site: IsomerSiteProps
  ScriptComponent?: ScriptComponentType
}

export interface VicaStylesheetProps {
  environment: IsomerSiteProps["environment"]
}
