// @ts-nocheck
/** @type {import('tailwindcss').Config} */
import { isomerSiteTheme, NextPreset } from "@opengovsg/isomer-components"

import siteConfig from "./data/config.json"

const plugin = require("tailwindcss/plugin")

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@opengovsg/isomer-components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [NextPreset],
  plugins: [
    isomerSiteTheme({
      colors: siteConfig.colors.brand,
    }),
    plugin(function ({ addUtilities, theme, e }) {
      // Gets all the gap values (like gap-1, gap-2, etc.) defined in the Tailwind theme
      // It's based on the existing gap utility in Tailwind.
      const gapValues = theme("gap")

      // Generate margin-based fallback for gap in flexbox
      const gapFallbackUtilities = Object.keys(gapValues).reduce((acc, key) => {
        const value = gapValues[key]

        // The current code doesn't account for reverse flex directions (flex-row-reverse and flex-column-reverse).
        // To cover these cases, additional rules would be needed to apply margins to the opposite sides
        // (left for row-reverse, bottom for column-reverse) and target different children.

        // Only apply the margin fallback if gap is not supported using arbitrary @supports not (gap: 1rem)
        // Also instead of overwriting the existing margin, we add to it.

        // Horizontal gaps (gap-x)
        acc[`.${e(`gap-x-${key}`)} > *:not(:last-child)`] = {
          "@supports not (gap: 1rem)": {
            marginRight: value,
          },
        }

        // Vertical gaps (gap-y)
        acc[`.${e(`gap-y-${key}`)} > *:not(:last-child)`] = {
          "@supports not (gap: 1rem)": {
            marginBottom: value,
          },
        }

        // Horizontal gaps for flex-row layout
        acc[`.${e(`gap-${key}`)}.flex-row > *:not(:last-child)`] = {
          "@supports not (gap: 1rem)": {
            marginRight: value,
          },
        }

        // Vertical gaps for flex-column layout
        acc[`.${e(`gap-${key}`)}.flex-col > *:not(:last-child)`] = {
          "@supports not (gap: 1rem)": {
            marginBottom: value,
          },
        }

        // Add support for grid layout
        // NOTE: This is not a complete implementation.
        // It does not account for grid-template-columns or grid-template-rows
        acc[`.${e(`gap-${key}`)}.grid > *:not(:last-child)`] = {
          "@supports not (gap: 1rem)": {
            marginRight: value,
            marginBottom: value,
          },
        }

        return acc
      }, {})

      addUtilities(gapFallbackUtilities, {
        // Enable responsive support e.g., sm:gap-1, md:gap-2
        variants: ["responsive"],
      })
    }),
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        ".w-fit": {
          width: "-webkit-fit-content",
        },
      }
      addUtilities(newUtilities, ["responsive"])
    }),
  ],
}

export default config
