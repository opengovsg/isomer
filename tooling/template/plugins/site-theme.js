import plugin from "tailwindcss/plugin"

import siteConfig from "../data/config.json" with { type: "json" }

// Sets the brand CSS variables consumed by --color-brand-* theme tokens.
// Equivalent to isomerSiteTheme({ colors: siteConfig.colors.brand }).
export default plugin(({ addBase }) => {
  const { canvas, interaction } = siteConfig.colors.brand
  addBase({
    ":root": {
      "--color-brand-canvas-default": canvas.default,
      "--color-brand-canvas-alt": canvas.alt,
      "--color-brand-canvas-backdrop": canvas.backdrop,
      "--color-brand-canvas-inverse": canvas.inverse,
      "--color-brand-interaction-default": interaction.default,
      "--color-brand-interaction-hover": interaction.hover,
      "--color-brand-interaction-pressed": interaction.pressed,
    },
  })
})
