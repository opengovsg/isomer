// @ts-nocheck
import plugin from "tailwindcss/plugin"

// CSS.escape polyfill for Node.js (the `e` helper was removed from the TailwindCSS v4 plugin API)
const e = (str) => str.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)

export default plugin(function ({ addBase, addUtilities, theme }) {
  // Gets all the gap values (like gap-1, gap-2, etc.) defined in the Tailwind theme.
  // It's based on the existing gap utility in Tailwind.
  const gapValues = theme("gap")

  // Generate margin-based fallback for gap in flexbox/grid.
  //
  // The current code doesn't account for reverse flex directions
  // (flex-row-reverse and flex-col-reverse). To cover these cases, additional
  // rules would be needed to apply margins to the opposite sides (left for
  // row-reverse, bottom for col-reverse) and target different children.
  //
  // Only applied when gap is not supported via @supports not (gap: 1rem).
  // Uses addBase (not addUtilities) so these rules land in @layer base and
  // don't conflict with any existing margin utilities.
  const gapFallbackUtilities = Object.keys(gapValues).reduce((acc, key) => {
    const value = gapValues[key]

    // Horizontal gaps (gap-x)
    acc[`.${e(`gap-x-${key}`)} > *:not(:last-child)`] = {
      "@supports not (gap: 1rem)": { marginRight: value },
    }
    // Vertical gaps (gap-y)
    acc[`.${e(`gap-y-${key}`)} > *:not(:last-child)`] = {
      "@supports not (gap: 1rem)": { marginBottom: value },
    }
    // Horizontal gaps for flex-row layout
    acc[`.${e(`gap-${key}`)}.flex-row > *:not(:last-child)`] = {
      "@supports not (gap: 1rem)": { marginRight: value },
    }
    // Vertical gaps for flex-col layout
    acc[`.${e(`gap-${key}`)}.flex-col > *:not(:last-child)`] = {
      "@supports not (gap: 1rem)": { marginBottom: value },
    }
    // Grid layout (NOTE: incomplete — does not account for grid-template-columns
    // or grid-template-rows)
    acc[`.${e(`gap-${key}`)}.grid > *:not(:last-child)`] = {
      "@supports not (gap: 1rem)": { marginRight: value, marginBottom: value },
    }

    return acc
  }, {})

  addBase(gapFallbackUtilities)

  // Webkit prefix for width: fit-content, needed for older Safari versions.
  addUtilities({
    ".w-fit": { width: "-webkit-fit-content" },
  })
})
