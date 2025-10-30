import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, ScriptComponentType } from "~/types"

// We can only pass in string values to the Vica script
// as React omit boolean props when spreading onto a DOM element,
// so they won't appear as attributes in the rendered HTML.
const BooleanStringOptions = Type.Union(
  [
    Type.Literal("true", { format: "hidden" }),
    Type.Literal("false", { format: "hidden" }),
  ],
  { format: "hidden" },
)

const HiddenOptionalString = Type.Optional(Type.String({ format: "hidden" }))

// NOTE: not all props will be used even if we passed them in
// as we will override some of them with Isomer's configuration e.g. font-family
// Nevertheless, keeping them here for reference
export const VicaSchema = Type.Object(
  {
    // UI Theme
    "app-id": Type.String({
      title: "VICA ID",
      description:
        "You can get this from [VICA Support](https://www.vica.gov.sg/contact-us/) after onboarding. If the widget doesn’t appear on your site, check that you have the correct ID.",
    }),
    "app-name": HiddenOptionalString,
    "app-icon": HiddenOptionalString,
    "app-subtitle": HiddenOptionalString, // configuration disabled (according to docs)
    "app-welcome-message": HiddenOptionalString,
    "app-font-family": HiddenOptionalString,
    "app-base-font-size": HiddenOptionalString,
    // General Color
    "app-color": HiddenOptionalString,
    "app-foreground-color1": HiddenOptionalString,
    "app-background-color2": HiddenOptionalString,
    "app-foreground-color2": HiddenOptionalString,
    "app-canvas-background-color": HiddenOptionalString,
    "app-button-border-color": HiddenOptionalString,
    "app-quick-reply-button-background-color": HiddenOptionalString,
    // Autocomplete
    "app-enable-auto-complete": Type.Optional(BooleanStringOptions),
    "app-auto-complete-background-color": HiddenOptionalString,
    "app-auto-complete-foreground-color": HiddenOptionalString,
    "app-auto-complete-hover-color": HiddenOptionalString,
    "app-auto-complete-divider-color": HiddenOptionalString,
    // Recommendations
    "app-enable-recommendations": Type.Optional(BooleanStringOptions),
    "app-recommendations-background-color": HiddenOptionalString,
    "app-recommendations-foreground-color": HiddenOptionalString,
    "app-recommendations-hover-color": HiddenOptionalString,
    // UI Behaviours
    "app-orchestrator-timeout": Type.Optional(
      Type.Number({ format: "hidden" }),
    ),
    "app-auto-launch": Type.Optional(BooleanStringOptions),
    "app-launched-animation-iteration": Type.Optional(
      Type.Number({ format: "hidden" }),
    ),
    "app-disable-csat": Type.Optional(BooleanStringOptions),
    // Chatbot Behaviours
    "app-quick-launch-event": HiddenOptionalString,
    "app-quick-launch-event-force-trigger": Type.Optional(BooleanStringOptions),
    "app-bot-response-trigger-event": HiddenOptionalString,
    "app-environment-override": HiddenOptionalString,
    "app-translation-languages": HiddenOptionalString,
    "app-enable-hide-translation": Type.Optional(BooleanStringOptions),
  },
  { format: "widget-integration/vica" },
)

export type VicaProps = Static<typeof VicaSchema>

export interface VicaWidgetClientProps extends VicaProps {
  environment: IsomerSiteProps["environment"]
  ScriptComponent: ScriptComponentType
}

export interface VicaWidgetProps extends VicaProps {
  site: Pick<IsomerSiteProps, "environment" | "siteMap" | "assetsBaseUrl">
  ScriptComponent: ScriptComponentType
}

export interface VicaStylesheetProps {
  environment: IsomerSiteProps["environment"]
}
