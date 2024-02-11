/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6031b6",
        secondary: "#4372d6",
        subtitle: "#344054",
        paragraph: "#344054",
        dark: "#6d58bb",
        prose: "#484848",
        headings: "#6d58bb",
        header: "#2164da",
        subtleLink: "#767676",
      },
      fontFamily: {
        sans: ["Lato", "ui-sans-serif", "system-ui"],
      },
      typography: ({ theme }) => ({
        isomer: {
          css: {
            "--tw-prose-body": theme("colors.prose"),
            "--tw-prose-headings": theme("colors.headings"),
            "--tw-prose-bullets": theme("colors.prose"),
            "--tw-prose-links": theme("colors.secondary"),
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
}
