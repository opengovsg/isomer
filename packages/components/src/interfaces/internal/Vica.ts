import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

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
    "app-auto-complete-background-color": HiddenOptionalString,
    "app-auto-complete-divider-color": HiddenOptionalString,
    "app-auto-complete-foreground-color": HiddenOptionalString,
    "app-auto-complete-hover-color": HiddenOptionalString,
    "app-auto-launch": Type.Optional(BooleanStringOptions),
    "app-background-color2": HiddenOptionalString,
    "app-base-font-size": HiddenOptionalString,
    "app-bot-response-trigger-event": HiddenOptionalString,
    "app-button-border-color": HiddenOptionalString,
    "app-canvas-background-color": HiddenOptionalString,
    "app-color": HiddenOptionalString,
    "app-disable-csat": Type.Optional(BooleanStringOptions),
    "app-enable-auto-complete": Type.Optional(BooleanStringOptions),
    "app-enable-hide-translation": Type.Optional(BooleanStringOptions),
    "app-enable-recommendations": Type.Optional(BooleanStringOptions),
    "app-environment-override": HiddenOptionalString,
    "app-font-family": HiddenOptionalString,
    "app-foreground-color1": HiddenOptionalString,
    "app-foreground-color2": HiddenOptionalString,
    "app-icon": HiddenOptionalString,
    "app-id": Type.String({
      description:
        "You can get this from [VICA Support](https://www.vica.gov.sg/contact-us/) after onboarding. If the widget doesn’t appear on your site, check that you have the correct ID.",
      title: "VICA ID",
    }),
    "app-launched-animation-iteration": Type.Optional(
      Type.Number({ format: "hidden" }),
    ),
    "app-name": HiddenOptionalString,
    "app-orchestrator-timeout": Type.Optional(
      Type.Number({ format: "hidden" }),
    ),
    "app-quick-launch-event": HiddenOptionalString,
    "app-quick-launch-event-force-trigger": Type.Optional(BooleanStringOptions),
    "app-quick-reply-button-background-color": HiddenOptionalString,
    "app-recommendations-background-color": HiddenOptionalString,
    "app-recommendations-foreground-color": HiddenOptionalString,
    "app-recommendations-hover-color": HiddenOptionalString,
    "app-subtitle": HiddenOptionalString,
    "app-translation-languages": HiddenOptionalString,
    "app-welcome-message": HiddenOptionalString,
    // NOTE: this is only enabled so that VICA's engineering team can test changes to the script
    // agency's users testing their draft bot should still use the production script
    // with "app-environment-override"=draft
    // Reference: https://opengovproducts.slack.com/archives/C087MUEJAMA/p1761820927407499?thread_ts=1761800290.229459&cid=C087MUEJAMA
    useDevStagingScript: Type.Optional(Type.Boolean({ format: "hidden" })),
  },
  { format: "widget-integration/vica" },
)

export type VicaProps = Static<typeof VicaSchema>

export type VicaWidgetClientProps = VicaProps

export type VicaWidgetProps = VicaProps & {
  site: Pick<IsomerSiteProps, "siteMapArray" | "assetsBaseUrl">
}

export type VicaStylesheetProps = Pick<VicaProps, "useDevStagingScript">
