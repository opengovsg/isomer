import plugin from "tailwindcss/plugin"

export const isomerSiteTheme = plugin(({ addBase }) => {
  addBase({
    // TODO: Inject dynamically based on whatever is passed in.
    ":root": {
      "--color-brand-canvas-default": "#e6ecef",
      "--color-brand-canvas-alt": "#bfcfd7",
      "--color-brand-canvas-backdrop": "#80a0af",
      "--color-brand-canvas-inverse": "#00405f",
      "--color-brand-interaction-default": "#00405f",
      "--color-brand-interaction-hover": "#002e44",
      "--color-brand-interaction-pressed": "#00283b",
    },
  })
})
