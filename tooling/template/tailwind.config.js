/** @type {import('tailwindcss').Config} */
import { isomerSiteTheme, NextPreset } from "@opengovsg/isomer-components"

import siteConfig from "./data/config.json"

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
  ],
}

export default config
