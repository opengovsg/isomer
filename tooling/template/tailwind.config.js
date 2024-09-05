/** @type {import('tailwindcss').Config} */
import { isomerSiteTheme, NextPreset } from "@opengovsg/isomer-components"

import siteConfig from "./data/config.json"

// TODO: Write a script that generates this file depending on the theme selected
// Replace the import + plugins with just the preset from the theme
// Pass the site config colours to the preset, let the preset handle the colours

// Do dynamic import + try-catch in the build script to validate the structure
// before continuing to build the template

// Maybe theme key put as package name instead

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
  theme: {
    extend: {
      colors: {
        site: {
          primary: {
            DEFAULT: siteConfig.colors["site-primary-default"],
            100: siteConfig.colors["site-primary-100"],
            200: siteConfig.colors["site-primary-200"],
          },
          secondary: {
            DEFAULT: siteConfig.colors["site-secondary-default"],
          },
        },
      },
    },
  },
}

export default config
