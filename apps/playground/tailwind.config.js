/** @type {import('tailwindcss').Config} */
import { isomerSiteTheme, NextPreset } from "@opengovsg/isomer-components"

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/components/dist/esm/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [NextPreset],
  plugins: [
    isomerSiteTheme({
      // Colours are based on MOH's colour scheme
      colors: {
        canvas: {
          default: "#e6ecef",
          alt: "#bfcfd7",
          backdrop: "#80a0af",
          inverse: "#00405f",
        },
        interaction: {
          default: "#00405f",
          hover: "#002e44",
          pressed: "#00283b",
        },
      },
    }),
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
            DEFAULT: "#877664",
          },
        },
      },
    },
  },
}
