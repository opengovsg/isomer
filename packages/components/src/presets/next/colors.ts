import twColors from "tailwindcss/colors"

export const colors = {
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
      inverse: {
        DEFAULT: twColors.white,
        subtle: twColors.zinc["400"],
      },
      light: twColors.gray["500"],
      medium: twColors.gray["800"],
      strong: twColors.gray["900"],
      subtle: twColors.gray["600"],
    },
    divider: {
      brand: "#1361F0",
      inverse: twColors.white,
      medium: twColors.gray["300"],
      strong: twColors.gray["400"],
      subtle: twColors.slate["200"],
      // NOTE: Change to site brand primary dynamic theme
    },
  },
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
  link: {
    DEFAULT: "#1A56E5",
    hover: "#1547BE",
    visited: twColors.violet["900"],
  },
  utility: {
    feedback: {
      alert: {
        DEFAULT: "#E51111",
        faint: "#FFF8F8",
        subtle: "#F8D4D4",
      },
      info: {
        DEFAULT: twColors.blue["500"],
        faint: "#EAF2FF",
        subtle: twColors.blue["100"],
      },
      success: {
        DEFAULT: "#009D47",
        faint: "#F6FCFA",
        subtle: "#A5E1CD",
      },
      warning: {
        DEFAULT: "#A97C00",
        faint: "#FEF9DA",
        subtle: "#FAEBB7",
      },
    },
    highlight: twColors.amber["400"],
  },
}
