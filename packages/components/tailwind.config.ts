import classicPreset from "./src/presets/classic"
import nextPreset from "./src/presets/next"

/**
 * This file is only used for storybook. The actual tailwind configuration that
 * built sites used is in the `tailwind.config.js` file in tooling/templates package.
 */

/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin")

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./.storybook/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [
    // Note: This is here temporarily until we can figure out how to load the
    // presets dynamically depending on the template being used.
    classicPreset,
    nextPreset,
  ],
  theme: {
    extend: {
      colors: {
        // Site-specific colors, will be overwritten by individual sites
        site: {
          primary: {
            DEFAULT: "#f78f1e",
            100: "#fef4e8",
            200: "#ffeec2",
          },
          secondary: {
            DEFAULT: "#4E4541",
            100: "#f4f2F1",
          },
        },
      },
    },
  },
  plugins: [
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
