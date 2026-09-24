import { NextPreset } from "@opengovsg/isomer-components"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@opengovsg/isomer-components/dist/**/*.{js,mjs,cjs}",
    "./node_modules/@opengovsg/isomer-components/src/**/*.{js,ts,jsx,tsx}",
    "../../node_modules/@opengovsg/isomer-components/dist/**/*.{js,mjs,cjs}",
    "../../node_modules/@opengovsg/isomer-components/src/**/*.{js,ts,jsx,tsx}",
  ],
  // Prevents Tailwind's content scanner from matching redirect-related
  // "[resource:...]" strings (source comments, test fixtures) as
  // arbitrary-property utilities. "[resource:...]" isn't valid CSS (oxfmt
  // >=0.57.0 rejects it); "[resource:some-resource]" is valid but stray noise.
  blocklist: ["[resource:...]", "[resource:some-resource]"],
  presets: [
    //   // Note: This is here temporarily until we can figure out how to load the
    //   // presets dynamically depending on the template being used.
    NextPreset,
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
}
