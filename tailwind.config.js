/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [
    require("./src/presets/next.js"),
    // Note: This is here temporarily until we can figure out how to load the
    // presets dynamically depending on the template being used.
    require("./src/presets/classic.js"),
  ],
  theme: {
    extend: {
      colors: {
        // Site-specific colors, will be overwritten by individual sites
        site: {
          primary: {
            DEFAULT: "#f78f1e",
          },
          secondary: {
            DEFAULT: "#877664",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
}
