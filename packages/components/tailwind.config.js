/** @type {import('tailwindcss').Config} */
import classicPreset from "./src/presets/classic"
import nextPreset from "./src/presets/next"

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
}
