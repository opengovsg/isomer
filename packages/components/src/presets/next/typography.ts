import plugin from "tailwindcss/plugin"

export const isomerTypography = plugin(({ addComponents, theme }) => {
  addComponents({
    ".prose-body-base": {
      "@apply text-[1rem] leading-[1.5]": {},
      fontWeight: theme("fontWeight.normal"),
      letterSpacing: "0",
      // keeping text-[1rem] to ensure it has minimum height of 1.5rem, even on mobile
      // This is to ensure it does not violate WCAG 2.2 (https://dequeuniversity.com/rules/axe/4.10/target-size)
      // Reference: https://github.com/opengovsg/isomer/pull/1640
    },
    ".prose-body-sm": {
      "@apply text-[0.9375rem] lg:text-[0.875rem] leading-[1.5]": {},
      fontWeight: theme("fontWeight.normal"),
      letterSpacing: "0",
      // Intentionally larger than desktop/tablet size. This is to ensure readability on mobile.
    },
    ".prose-display-lg": {
      "@apply text-[2.25rem] lg:text-[3rem] leading-[1.2] lg:leading-[1.1]": {},
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
    },
    ".prose-display-md": {
      "@apply text-[1.75rem] lg:text-[2.25rem] leading-[1.2]": {},
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
    },
    ".prose-display-sm": {
      "@apply text-[1.5rem] lg:text-[1.938rem] leading-[1.2]": {},
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
    },
    ".prose-display-xl": {
      "@apply text-[3rem] xl:text-[4.25rem] leading-[1.2] xl:leading-[1.1]": {},
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
    },
    ".prose-display-xs": {
      "@apply text-[1.25rem] lg:text-[1.5rem] leading-[1.2]": {},
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
    },
    ".prose-headline-base": {
      "@apply text-[0.9375rem] lg:text-[1rem] leading-[1.4]": {},
      letterSpacing: "0",
    },
    ".prose-headline-base-medium": {
      "@apply prose-headline-base": {},
      fontWeight: theme("fontWeight.medium"),
    },
    ".prose-headline-base-semibold": {
      "@apply prose-headline-base": {},
      fontWeight: theme("fontWeight.semibold"),
    },
    ".prose-headline-lg": {
      "@apply text-[1.0625rem] lg:text-[1.125rem] leading-[1.3]": {},
      letterSpacing: "0",
    },
    ".prose-headline-lg-medium": {
      "@apply prose-headline-lg": {},
      fontWeight: theme("fontWeight.medium"),
    },
    ".prose-headline-lg-regular": {
      "@apply prose-headline-lg": {},
      fontWeight: theme("fontWeight.normal"),
    },
    ".prose-headline-lg-semibold": {
      "@apply prose-headline-lg": {},
      fontWeight: theme("fontWeight.semibold"),
    },
    ".prose-label-md": {
      fontSize: "0.875rem",
      letterSpacing: "0",
      lineHeight: "1.5",
    },
    ".prose-label-md-medium": {
      "@apply prose-label-md": {},
      fontWeight: theme("fontWeight.medium"),
    },
    ".prose-label-md-regular": {
      "@apply prose-label-md": {},
      fontWeight: theme("fontWeight.normal"),
    },
    ".prose-label-sm": {
      fontSize: "0.75rem",
      letterSpacing: "0",
      lineHeight: "1.5",
    },
    ".prose-label-sm-medium": {
      "@apply prose-label-sm": {},
      fontWeight: theme("fontWeight.medium"),
    },
    ".prose-label-sm-regular": {
      "@apply prose-label-sm": {},
      fontWeight: theme("fontWeight.normal"),
    },
    ".prose-title-lg": {
      "@apply text-[1.1875rem] lg:text-[1.5rem] leading-[1.3]": {},
      letterSpacing: "0",
    },
    ".prose-title-lg-medium": {
      "@apply prose-title-lg": {},
      fontWeight: theme("fontWeight.medium"),
    },
    ".prose-title-lg-regular": {
      "@apply prose-title-lg": {},
      fontWeight: theme("fontWeight.normal"),
    },
    ".prose-title-md": {
      "@apply text-[1.0625rem] lg:text-[1.25rem] leading-[1.3]": {},
      letterSpacing: "0",
    },
    ".prose-title-md-medium": {
      "@apply prose-title-md": {},
      fontWeight: theme("fontWeight.medium"),
    },
    ".prose-title-md-semibold": {
      "@apply prose-title-md": {},
      fontWeight: theme("fontWeight.semibold"),
    },
  })
})
