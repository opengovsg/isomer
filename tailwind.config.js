/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      primary: "#6031b6",
      secondary: "#4372d6",
      subtitle: "#344054",
      paragraph: "#344054",
    },
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"), // ? tailwinds form added here.
    require("@tailwindcss/typography"),
  ],
}
