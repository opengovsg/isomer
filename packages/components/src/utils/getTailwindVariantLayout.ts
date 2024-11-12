import type { IsomerPageLayoutType } from "~/types"

export const TAILWIND_SIMPLIFIED_LAYOUTS = {
  Homepage: "homepage",
  Default: "default",
} as const

type TailwindSimplifiedLayoutType =
  (typeof TAILWIND_SIMPLIFIED_LAYOUTS)[keyof typeof TAILWIND_SIMPLIFIED_LAYOUTS]

// This is a simplified layout used for determining the variant to use for
// components that vary the design depending on the layout of the page
export const getTailwindVariantLayout = (
  layout: IsomerPageLayoutType,
): TailwindSimplifiedLayoutType => {
  switch (layout) {
    case "homepage":
    case "notfound":
      return TAILWIND_SIMPLIFIED_LAYOUTS.Homepage
    default:
      return TAILWIND_SIMPLIFIED_LAYOUTS.Default
  }
}
