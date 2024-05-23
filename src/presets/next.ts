/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin"

export default {
  theme: {
    extend: {
      boxShadow: {
        sm: "0 0px 10px 0px rgba(191, 191, 191, 0.5)",
      },
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
      letterSpacing: {
        tight: "-0.022em",
      },
      screens: {
        xs: "576px",
      },
      spacing: {
        container: "1240px",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities, theme }: any) => {
      addUtilities({
        /* Heading typography tokens */
        ".text-heading-01": {
          fontSize: "2.75rem",
          lineHeight: "3.25rem",
          fontWeight: "600",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "3.75rem",
            lineHeight: "4rem",
          },
        },

        ".text-heading-02": {
          fontSize: "2.375rem",
          lineHeight: "2.75rem",
          fontWeight: "600",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "3rem",
            lineHeight: "3.625rem",
          },
        },

        ".text-heading-03": {
          fontSize: "1.625rem",
          lineHeight: "2rem",
          fontWeight: "600",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "2.25rem",
            lineHeight: "3rem",
          },
        },

        ".text-heading-04": {
          fontSize: "1.125rem",
          lineHeight: "1.5rem",
          fontWeight: "600",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "1.5rem",
            lineHeight: "2.25rem",
          },
        },

        ".text-heading-04-medium": {
          fontSize: "1.125rem",
          lineHeight: "1.5rem",
          fontWeight: "500",
          letterSpacing: theme("letterSpacing.tight"),
          "@media (min-width: 1024px)": {
            fontSize: "1.5rem",
            lineHeight: "2.25rem",
          },
        },

        ".text-heading-05": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "600",
          "@media (min-width: 1024px)": {
            fontSize: "1.25rem",
            lineHeight: "1.5rem",
          },
        },

        ".text-heading-06": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "500",
          letterSpacing: "0.05em",
        },

        /* Sub-heading typography tokens */
        ".text-subheading-01": {
          fontSize: "1rem",
          lineHeight: "1.25rem",
          fontWeight: "500",
        },

        /* Paragraph typography tokens */
        ".text-paragraph-01": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          "@media (min-width: 1024px)": {
            fontSize: "1.25rem",
            lineHeight: "2rem",
          },
        },

        ".text-paragraph-01-medium": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontWeight: "500",
          "@media (min-width: 1024px)": {
            fontSize: "1.25rem",
            lineHeight: "2rem",
          },
        },

        ".text-paragraph-02": {
          fontSize: "0.875rem",
          lineHeight: "1.5",
          "@media (min-width: 1024px)": {
            fontSize: "1.125rem",
            lineHeight: "1.75rem",
          },
        },

        ".text-paragraph-03": {
          fontSize: "0.875rem",
          lineHeight: "1.5",
          "@media (min-width: 1024px)": {
            fontSize: "1rem",
            lineHeight: "1.5rem",
          },
        },

        /* Caption typography tokens */
        ".text-caption-01": {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
        },

        ".text-caption-01-medium": {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          fontWeight: "500",
        },

        /* Other typography tokens */
        ".text-button-link-01": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
          "@media (min-width: 1024px)": {
            fontSize: "1.125rem",
            lineHeight: "1.75rem",
          },
        },
      })
    }),
  ],
}
