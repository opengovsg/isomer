/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        border: {
          light: "#d6d6d6",
        },
        canvas: {
          base: "#ffffff",
          inverse: "#000000",
          translucentGrey: "#00000080",
        },
        header: "#2164da",
        headings: "#6d58bb",
        navItems: "#323232",
        paragraph: "#344054",
        prose: "#484848",
        subtitle: "#344054",
        subtleLink: "#767676",
        site: {
          primary: {
            DEFAULT: "#6031b6",
            hover: "#4b268e",
          },
          secondary: {
            DEFAULT: "#4372d6",
          },
        },
      },
      typography: ({ theme }: any) => ({
        isomer: {
          css: {
            "--tw-prose-body": theme("colors.prose"),
            "--tw-prose-headings": theme("colors.headings"),
            "--tw-prose-bullets": theme("colors.prose"),
            "--tw-prose-links": theme("colors.site.secondary"),
          },
        },
      }),
    },
  },
};
