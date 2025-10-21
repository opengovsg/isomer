import plugin from "tailwindcss/plugin"

export const isomerTypography = plugin(({ addComponents, theme }) => {
  addComponents({
    // Display
    // Large prominent titles
    ".prose-display-xl": {
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
      "@apply text-[3rem] lg:text-[4.25rem] leading-[1.2] lg:leading-[1.1]": {},
    },
    ".prose-display-lg": {
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
      "@apply text-[2.25rem] lg:text-[3rem] leading-[1.2] lg:leading-[1.1]": {},
    },
    ".prose-display-md": {
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
      "@apply text-[1.75rem] md:text-[2.25rem] leading-[1.2]": {},
    },
    ".prose-display-sm": {
      fontWeight: theme("fontWeight.semibold"),
      letterSpacing: "-0.022em",
      "@apply text-[1.25rem] lg:text-[1.5rem] leading-[1.2]": {},
    },
    // Title
    // Group major sections
    ".prose-title-lg": {
      letterSpacing: "0",
      "@apply text-[1.1875rem] lg:text-[1.5rem] leading-[1.3]": {},
    },
    ".prose-title-lg-medium": {
      fontWeight: theme("fontWeight.medium"),
      "@apply prose-title-lg": {},
    },
    ".prose-title-lg-regular": {
      fontWeight: theme("fontWeight.normal"),
      "@apply prose-title-lg": {},
    },
    ".prose-title-md": {
      letterSpacing: "0",
      "@apply text-[1.0625rem] lg:text-[1.25rem] leading-[1.3]": {},
    },
    ".prose-title-md-semibold": {
      fontWeight: theme("fontWeight.semibold"),
      "@apply prose-title-md": {},
    },
    ".prose-title-md-medium": {
      fontWeight: theme("fontWeight.medium"),
      "@apply prose-title-md": {},
    },
    // Headline
    // Attention to specific part of section
    ".prose-headline-lg": {
      letterSpacing: "0",
      "@apply text-[1.0625rem] lg:text-[1.125rem] leading-[1.3]": {},
    },
    ".prose-headline-lg-semibold": {
      fontWeight: theme("fontWeight.semibold"),
      "@apply prose-headline-lg": {},
    },
    ".prose-headline-lg-medium": {
      fontWeight: theme("fontWeight.medium"),
      "@apply prose-headline-lg": {},
    },
    ".prose-headline-lg-regular": {
      fontWeight: theme("fontWeight.normal"),
      "@apply prose-headline-lg": {},
    },
    ".prose-headline-base": {
      letterSpacing: "0",
      "@apply text-[0.9375rem] lg:text-[1rem] leading-[1.4]": {},
    },
    ".prose-headline-base-semibold": {
      fontWeight: theme("fontWeight.semibold"),
      "@apply prose-headline-base": {},
    },
    ".prose-headline-base-medium": {
      fontWeight: theme("fontWeight.medium"),
      "@apply prose-headline-base": {},
    },
    // Body
    // Main text content (multiple lines)
    ".prose-body-base": {
      fontWeight: theme("fontWeight.normal"),
      letterSpacing: "0",
      // keeping text-[1rem] to ensure it has minimum height of 1.5rem, even on mobile
      // This is to ensure it does not violate WCAG 2.2 (https://dequeuniversity.com/rules/axe/4.10/target-size)
      // Reference: https://github.com/opengovsg/isomer/pull/1640
      "@apply text-[1rem] leading-[1.5]": {},
    },
    ".prose-body-sm": {
      fontWeight: theme("fontWeight.normal"),
      letterSpacing: "0",
      // Intentionally larger than desktop/tablet size. This is to ensure readability on mobile.
      "@apply text-[0.9375rem] lg:text-[0.875rem] leading-[1.5]": {},
    },
    // Label
    // Single-line explanatory text
    ".prose-label-md": {
      letterSpacing: "0",
      fontSize: "0.875rem",
      lineHeight: "1.5",
    },
    ".prose-label-md-medium": {
      fontWeight: theme("fontWeight.medium"),
      "@apply prose-label-md": {},
    },
    ".prose-label-md-regular": {
      fontWeight: theme("fontWeight.normal"),
      "@apply prose-label-md": {},
    },
    ".prose-label-sm": {
      letterSpacing: "0",
      fontSize: "0.75rem",
      lineHeight: "1.5",
    },
    ".prose-label-sm-medium": {
      fontWeight: theme("fontWeight.medium"),
      "@apply prose-label-sm": {},
    },
    ".prose-label-sm-regular": {
      fontWeight: theme("fontWeight.normal"),
      "@apply prose-label-sm": {},
    },
  })
})
