import plugin from "tailwindcss/plugin"

interface SiteThemeOptions {
  colors: {
    canvas: {
      default: string
      alt: string
      backdrop: string
      inverse: string
    }
    interaction: {
      default: string
      hover: string
      pressed: string
    }
  }
}

export const isomerSiteTheme = plugin.withOptions(
  ({ colors }: SiteThemeOptions) =>
    ({ addBase }) => {
      addBase({
        // TODO: Inject dynamically based on whatever is passed in.
        ":root": {
          "--color-brand-canvas-default": colors.canvas.default,
          "--color-brand-canvas-alt": colors.canvas.alt,
          "--color-brand-canvas-backdrop": colors.canvas.backdrop,
          "--color-brand-canvas-inverse": colors.canvas.inverse,
          "--color-brand-interaction-default": colors.interaction.default,
          "--color-brand-interaction-hover": colors.interaction.hover,
          "--color-brand-interaction-pressed": colors.interaction.pressed,
        },
      })
    },
)
