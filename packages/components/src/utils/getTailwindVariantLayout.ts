import type { IsomerPageLayoutType } from "~/types"

// This is a simplified layout used for determining the variant to use for
// components that vary the design depending on the layout of the page
export const getTailwindVariantLayout = (layout: IsomerPageLayoutType) => {
  if (layout === "homepage" || layout === "notfound") {
    return "homepage"
  }

  return "default"
}
