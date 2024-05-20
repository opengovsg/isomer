/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#ffffff",
          overlay: "#00000066",
          dark: "#2B2313",
          inverse: "#2c2c2c",
        },
        content: {
          DEFAULT: "#333333",
          medium: "#5d5d5d",
          strong: "#2c2e34",
          inverse: {
            DEFAULT: "#ffffff",
            light: "#c1c1c1",
          },
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
          strong: "#484848",
          subtle: "#f2f2f2",
        },
        utility: {
          info: {
            DEFAULT: "#87bdff",
            subtle: "#e0eeff",
          },
          neutral: {
            DEFAULT: "#f3f2f1",
            subtle: "#fcfcfc",
            neutral: "#f4f2f1",
          },
        },
        interaction: {
          main: {
            DEFAULT: "#333333",
            hover: "#191919",
            active: "#191919",
            subtle: {
              hover: "#f4f9ff",
            },
          },
          link: {
            DEFAULT: "#333333",
            hover: "#333333",
            active: "#333333",
          },
          sub: {
            DEFAULT: "#f3f3f3",
          },
          support: {
            placeholder: "#838894",
          },
        },
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
      screens: {
        xs: "576px",
      },
      spacing: {
        container: "1240px",
      },
      boxShadow: {
        sm: "0 0px 10px 0px rgba(191, 191, 191, 0.5)",
      },
    },
  },
}
