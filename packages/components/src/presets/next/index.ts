import type { Config } from "tailwindcss"
import racPlugin from "tailwindcss-react-aria-components"
import defaultTheme from "tailwindcss/defaultTheme"
import plugin from "tailwindcss/plugin"

import { colors } from "./colors"
import { isomerTypography } from "./typography"

const config: Config = {
  content: [],
  theme: {
    screens: {
      // breakpoints need to be sorted from smallest to largest in order to work as expected with a min-width breakpoint system
      // See https://tailwindcss.com/docs/screens#adding-smaller-breakpoints
      xs: "576px",
      //
      ...defaultTheme.screens,
    },
    extend: {
      screens: {
        xl: "1240px",
      },
      keyframes: {
        buttonPulse: {
          "0%, 100%": { backgroundColor: "rgba(0, 0, 0, 0.65)" },
          "50%": { backgroundColor: "rgba(0, 0, 0, 0.325)" },
        },
        slideUpFadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "button-pulse": "buttonPulse 2s ease-in infinite",
        "slide-up-fade-in": "slideUpFadeIn 0.3s ease-in-out",
      },
      boxShadow: {
        sm: "0 0px 10px 0px rgba(191, 191, 191, 0.5)",
        "focus-visible": `0px -2px ${colors.utility.highlight}, 0 2px ${colors.base.content.strong}`,
      },
      colors: {
        ...colors,
        // Everything below is deprecated and should be removed when
        // all components are using the new color tokens above
        canvas: {
          DEFAULT: "#ffffff",
          overlay: "#00000066",
          dark: "#2B2313",
          inverse: "#2c2c2c",
        },
        content: {
          DEFAULT: "#333333",
          medium: "#5d5d5d",
          strong: "#2c2e34",
          inverse: {
            DEFAULT: "#ffffff",
            light: "#c1c1c1",
          },
        },
        hyperlink: {
          DEFAULT: "#1361f0",
          inverse: "#ffffff",
          hover: {
            DEFAULT: "#0d4fca",
            inverse: "#ededed",
          },
          visited: {
            DEFAULT: "#530085",
            inverse: "#ffffff",
          },
        },
        focus: {
          outline: "#0d4fca",
        },
        divider: {
          medium: "#d0d0d0",
          strong: "#484848",
          subtle: "#f2f2f2",
        },
        utility: {
          ...colors.utility,
          info: {
            DEFAULT: "#87bdff",
            subtle: "#e0eeff",
          },
          neutral: {
            DEFAULT: "#f3f2f1",
            subtle: "#fcfcfc",
            neutral: "#f4f2f1",
          },
        },
        interaction: {
          main: {
            DEFAULT: "#333333",
            hover: "#191919",
            active: "#191919",
            subtle: {
              hover: "#f4f9ff",
            },
          },
          link: {
            DEFAULT: "#333333",
            hover: "#333333",
            active: "#333333",
          },
          sub: {
            DEFAULT: "#f3f3f3",
          },
          support: {
            placeholder: "#838894",
          },
        },
        site: {
          primary: {
            DEFAULT: "#f78f1e",
            100: "#fef4e8",
            200: "#ffeec2",
          },
          secondary: {
            DEFAULT: "#877664",
          },
        },
      },
      fontFamily: {
        sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
      },
      letterSpacing: {
        tight: "-0.022em",
      },
    },
  },
  plugins: [
    racPlugin,
    isomerTypography,
    plugin(({ addBase }) => {
      addBase({
        "::-webkit-details-marker": {
          display: "none",
        },
      })
    }),
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        // Using tailwind v3 which lacks "wrap-anywhere" utility (only from v4)
        // https://tailwindcss.com/docs/overflow-wrap#wrapping-anywhere
        ".tailwindv3-wrap-anywhere": {
          "overflow-wrap": "anywhere",
        },
      }
      addUtilities(newUtilities)
    }),
    // !! @deprecated, use isomerTypography plugin instead
    // Delete after no components are using these classes anymore,
    plugin(({ addBase, addUtilities, theme }) => {
      addUtilities({
        /* Heading typography tokens */
        ".text-heading-01": {
          fontSize: "2.75rem",
          lineHeight: "3.25rem",
          fontWeight: "600",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "3.75rem",
            lineHeight: "4rem",
          },
        },

        ".text-heading-02": {
          fontSize: "2.375rem",
          lineHeight: "2.75rem",
          fontWeight: "600",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "2.7rem",
            lineHeight: "3.2rem",
          },
        },

        ".text-heading-03": {
          fontSize: "1.625rem",
          lineHeight: "2rem",
          fontWeight: "600",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "2.25rem",
            lineHeight: "3rem",
          },
        },

        ".text-heading-04": {
          fontSize: "1.125rem",
          lineHeight: "1.5rem",
          fontWeight: "600",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "1.5rem",
            lineHeight: "2.25rem",
          },
        },

        ".text-heading-04-medium": {
          fontSize: "1.125rem",
          lineHeight: "1.5rem",
          fontWeight: "500",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "1.5rem",
            lineHeight: "2.25rem",
          },
        },

        ".text-heading-05": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "600",
          "@media (min-width: 1024px)": {
            fontSize: "1.25rem",
            lineHeight: "1.5rem",
          },
        },

        ".text-heading-06": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "500",
          letterSpacing: "0.05em",
        },

        /* Sub-heading typography tokens */
        ".text-subheading-01": {
          fontSize: "1rem",
          lineHeight: "1.25rem",
          fontWeight: "500",
        },

        /* Paragraph typography tokens */
        ".text-paragraph-01": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          "@media (min-width: 1024px)": {
            fontSize: "1.25rem",
            lineHeight: "2rem",
          },
        },

        ".text-paragraph-01-medium": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "500",
          "@media (min-width: 1024px)": {
            fontSize: "1.25rem",
            lineHeight: "2rem",
          },
        },

        ".text-paragraph-02": {
          fontSize: "0.875rem",
          lineHeight: "1.5",
          "@media (min-width: 1024px)": {
            fontSize: "1.125rem",
            lineHeight: "1.75rem",
          },
        },

        ".text-paragraph-03": {
          fontSize: "0.875rem",
          lineHeight: "1.5",
          "@media (min-width: 1024px)": {
            fontSize: "1rem",
            lineHeight: "1.5rem",
          },
        },

        /* Caption typography tokens */
        ".text-caption-01": {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
        },

        ".text-caption-01-medium": {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          fontWeight: "500",
        },

        /* Other typography tokens */
        ".text-button-link-01": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          "@media (min-width: 1024px)": {
            fontSize: "1.125rem",
            lineHeight: "1.75rem",
          },
        },
      })

      // Add Inter as a base font
      // CSS taken from https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap
      addBase({
        // @ts-expect-error Tailwind types did not account for @font-face
        "@font-face": [
          {
            fontFamily: "Inter",
            fontStyle: "normal",
            fontWeight: "100 900",
            fontDisplay: "swap",
            src: "url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5n-wU.woff2) format('woff2')",
            unicodeRange:
              "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
          },
          {
            fontFamily: "Inter",
            fontStyle: "normal",
            fontWeight: "100 900",
            fontDisplay: "swap",
            src: "url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7W0Q5n-wU.woff2) format('woff2')",
            unicodeRange:
              "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
          },
          {
            fontFamily: "Inter",
            fontStyle: "normal",
            fontWeight: "100 900",
            fontDisplay: "swap",
            src: "url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7W0Q5n-wU.woff2) format('woff2')",
            unicodeRange: "U+1F00-1FFF",
          },
          {
            fontFamily: "Inter",
            fontStyle: "normal",
            fontWeight: "100 900",
            fontDisplay: "swap",
            src: "url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7W0Q5n-wU.woff2) format('woff2')",
            unicodeRange:
              "U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF",
          },
          {
            fontFamily: "Inter",
            fontStyle: "normal",
            fontWeight: "100 900",
            fontDisplay: "swap",
            src: "url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7W0Q5n-wU.woff2) format('woff2')",
            unicodeRange:
              "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB",
          },
          {
            fontFamily: "Inter",
            fontStyle: "normal",
            fontWeight: "100 900",
            fontDisplay: "swap",
            src: "url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7W0Q5n-wU.woff2) format('woff2')",
            unicodeRange:
              "U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
          },
          {
            fontFamily: "Inter",
            fontStyle: "normal",
            fontWeight: "100 900",
            fontDisplay: "swap",
            src: "url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2) format('woff2')",
            unicodeRange:
              "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
          },
        ],
      })
    }),
  ],
}

export default config
