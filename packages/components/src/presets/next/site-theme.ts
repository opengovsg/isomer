import type { PluginWithConfig } from "tailwindcss/plugin"
import plugin from "tailwindcss/plugin"

// Local alias to avoid referencing Tailwind's private PluginWithOptions type in the
// generated .d.ts, which would reference a hashed internal file (types-CJYAW1ql.mjs).
type PluginWithOptions<T> = {
  (options?: T): PluginWithConfig
  __isOptionsFunction: true
}

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
  (options?: SiteThemeOptions) =>
    ({ addBase }) => {
      if (!options) return
      const { colors } = options
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
