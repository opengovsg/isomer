import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { SUPPORTED_ICON_NAMES } from "~/common/icons"

// Theme specific config
export const BUTTON_COLOR_SCHEMES = ["black", "white"] as const
export const BUTTON_VARIANTS = ["solid", "outline", "ghost", "link"] as const
export const BUTTON_SIZES = ["base", "sm"] as const

export const ButtonSchema = Type.Object(
  {
    type: Type.Literal("button", { default: "button" }),
    label: Type.String({
      title: "Button label",
      description: "The text to display on the button",
    }),
    href: Type.String({
      title: "Button URL",
      description: "The URL to navigate to when the button is clicked",
      format: "uri",
    }),
    colorScheme: Type.Optional(
      Type.Union(
        BUTTON_COLOR_SCHEMES.map((colorScheme) => Type.Literal(colorScheme)),
        {
          title: "Button color scheme",
          description: "The color scheme to use for the button",
          type: "string",
        },
      ),
    ),
    variant: Type.Optional(
      Type.Union(
        BUTTON_VARIANTS.map((variant) => Type.Literal(variant)),
        {
          title: "Button variant",
          description: "The variant to use for the button",
          type: "string",
        },
      ),
    ),
    size: Type.Optional(
      Type.Union(
        BUTTON_SIZES.map((size) => Type.Literal(size)),
        {
          title: "Button size",
          description: "The size to use for the button",
          type: "string",
        },
      ),
    ),
    rounded: Type.Optional(
      Type.Boolean({
        title: "Rounded button",
        description: "Whether the button should have rounded corners",
      }),
    ),
    leftIcon: Type.Optional(
      Type.Union(
        SUPPORTED_ICON_NAMES.map((icon) => Type.Literal(icon)),
        {
          title: "Button left icon",
          description: "The icon to display on the left of the button's text",
          type: "string",
        },
      ),
    ),
    rightIcon: Type.Optional(
      Type.Union(
        SUPPORTED_ICON_NAMES.map((icon) => Type.Literal(icon)),
        {
          title: "Button right icon",
          description: "The icon to display on the right of the button's text",
          type: "string",
        },
      ),
    ),
  },
  {
    title: "Button component",
  },
)

export type ButtonColorScheme = (typeof BUTTON_COLOR_SCHEMES)[number]
export type ButtonProps = Static<typeof ButtonSchema> & {
  LinkComponent?: any
}
