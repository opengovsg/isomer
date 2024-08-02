/**
 * Keep in sync with packages/components/src/presets/next/typography.ts,
 * or deduplicate between prose classes will not work as expected.
 */
import { createTV } from "tailwind-variants"

export const tv = createTV({
  twMergeConfig: {
    classGroups: {
      prose: [
        "prose-display-xl",
        "prose-display-lg",
        "prose-display-md",
        "prose-display-sm",
        "prose-title-lg",
        "prose-title-lg-medium",
        "prose-title-lg-regular",
        "prose-title-md",
        "prose-title-md-semibold",
        "prose-title-md-medium",
        "prose-headline-lg",
        "prose-headline-lg-semibold",
        "prose-headline-lg-medium",
        "prose-headline-lg-regular",
        "prose-headline-base",
        "prose-headline-base-semibold",
        "prose-headline-base-medium",
        "prose-body-base",
        "prose-body-sm",
        "prose-label-md",
        "prose-label-md-medium",
        "prose-label-md-regular",
        "prose-label-sm",
        "prose-label-sm-medium",
        "prose-label-sm-regular",
      ],
    },
  },
})
