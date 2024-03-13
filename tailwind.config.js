/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6031b6",
        primaryHover: "#4b268e",
        secondary: "#4372d6",
        subtitle: "#344054",
        paragraph: "#344054",
        dark: "#6d58bb",
        prose: "#484848",
        headings: "#6d58bb",
        header: "#2164da",
        subtleLink: "#767676",
        navItems: "#323232",
        border: {
          light: "#d6d6d6",
        },
        canvas: {
          base: "#ffffff",
          inverse: "#000000",
          translucentGrey: "#00000080",
          dark: "#2B2313",
        },
        content: {
          base: "#344054",
          body: "#484848",
          inverse: "#ffffff",
        },
        interaction: {
          hover: "#f9f9f9",
          linkDefault: "#4372d6",
          linkHover: "#3a79ff",
        },
        stroke: {
          default: "#d0d5dd",
        },
        utility: {
          themeColor: "var(--color-primary)",
          secondaryColor: "var(--color-secondary)",
        },
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
