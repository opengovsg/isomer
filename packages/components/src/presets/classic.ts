import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

import { createNextPreset } from "./next"

// Classic's palette from d6aa299a5^, on the shared defaults used by inherited blocks.
// Breakpoints stay shared with useBreakpoint and inherited layouts.
export const ClassicPreset: Config = {
  content: [],
  presets: [createNextPreset({ includeFonts: false })],
  theme: {
    extend: {
      fontFamily: { sans: ["Lato", ...defaultTheme.fontFamily.sans] },
      colors: {
        border: { light: "#d6d6d6" },
        canvas: { base: "#ffffff", translucentGrey: "#00000080" },
        header: "var(--color-brand-interaction-default)",
        headings: "var(--color-brand-canvas-inverse)",
        navItems: "#323232",
        paragraph: "#344054",
        prose: "#484848",
        subtitle: "#344054",
        subtleLink: "#767676",
        site: {
          primary: {
            DEFAULT: "var(--color-brand-canvas-inverse)",
            hover: "var(--color-brand-interaction-hover)",
          },
          secondary: { DEFAULT: "var(--color-brand-interaction-default)" },
        },
      },
    },
  },
}
