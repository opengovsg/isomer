/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: "#2B2313",
        },
        content: {
          DEFAULT: "#333333",
          medium: "#5d5d5d",
          strong: "#2c2e34",
          inverse: "#ffffff",
        },
        hyperlink: {
          DEFAULT: "#1361f0",
          inverse: "#ffffff",
          hover: {
            DEFAULT: "#0d4fca",
            inverse: "#ededed",
          },
          visited: {
            DEFAULT: "#530085",
            inverse: "#ffffff",
          },
        },
        focus: {
          outline: "#0d4fca",
        },
        divider: {
          medium: "#d0d0d0",
        },
        utility: {
          info: {
            DEFAULT: "#87bdff",
            subtle: "#e0eeff",
          },
        },
        interaction: {
          main: {
            DEFAULT: "#333333",
            hover: "#f78d1b",
            active: "#f78d1b",
          },
          link: {
            DEFAULT: "#333333",
            hover: "#333333",
            active: "#333333",
          },
        },
      },
      screens: {
        xs: "576px",
      },
    },
  },
}
