import twColors from "tailwindcss/colors"

export const colors = {
  // TODO: Use CSS variables for brand
  brand: {
    canvas: {
      DEFAULT: "#E6ECEF",
      alt: "#BFCFD7",
      backdrop: "#80A0AF",
      inverse: "#00405F",
    },
    interaction: {
      DEFAULT: "#00405F",
      hover: "#002E44",
      pressed: "#00283B",
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
      strong: twColors.gray["900"],
      medium: twColors.gray["800"],
      subtle: twColors.gray["600"],
      inverse: {
        DEFAULT: twColors.white,
        subtle: twColors.slate["200"],
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
    DEFAULT: twColors.blue["600"],
    hover: "#0D4FCA",
    active: "#0B44AC",
  },
  utility: {
    feedback: {
      info: {
        DEFAULT: twColors.blue["500"],
        subtle: twColors.blue["100"],
      },
    },
  },
}
