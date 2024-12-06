import twColors from "tailwindcss/colors"

export const colors = {
  brand: {
    canvas: {
      DEFAULT: "var(--color-brand-canvas-default)",
      alt: "var(--color-brand-canvas-alt)",
      backdrop: "var(--color-brand-canvas-backdrop)",
      inverse: "var(--color-brand-canvas-inverse)",
    },
    interaction: {
      DEFAULT: "var(--color-brand-interaction-default)",
      hover: "var(--color-brand-interaction-hover)",
      pressed: "var(--color-brand-interaction-pressed)",
    },
  },
  base: {
    canvas: {
      DEFAULT: twColors.white,
      alt: twColors.gray["50"],
      backdrop: twColors.gray["100"],
      inverse: {
        DEFAULT: twColors.zinc["900"],
        overlay: twColors.zinc["700"],
      },
    },
    content: {
      DEFAULT: twColors.gray["700"],
      light: twColors.gray["500"],
      strong: twColors.gray["900"],
      medium: twColors.gray["800"],
      subtle: twColors.gray["600"],
      inverse: {
        DEFAULT: twColors.white,
        subtle: twColors.zinc["400"],
      },
    },
    divider: {
      subtle: twColors.slate["200"],
      medium: twColors.gray["300"],
      strong: twColors.gray["400"],
      inverse: twColors.white,
      // TODO: Change to site brand primary dynamic theme
      brand: "#1361F0",
    },
  },
  link: {
    DEFAULT: "#1A56E5",
    hover: "#1547BE",
    visited: twColors.violet["900"],
  },
  utility: {
    highlight: twColors.amber["400"],
    feedback: {
      info: {
        DEFAULT: twColors.blue["500"],
        subtle: twColors.blue["100"],
        faint: "#EAF2FF",
      },
      warning: "#FFCC15",
    },
  },
}
