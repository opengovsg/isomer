import type { IsomerPageLayoutType } from "~/types"
import { ISOMER_PAGE_LAYOUTS } from "~/types"

// This is a simplified layout used for determining the variant to use for
// components that vary the design depending on the layout of the page
export const getTailwindVariantLayout = (layout: IsomerPageLayoutType) => {
  if (
    layout === ISOMER_PAGE_LAYOUTS.Homepage ||
    layout === ISOMER_PAGE_LAYOUTS.NotFound
  ) {
    return ISOMER_PAGE_LAYOUTS.Homepage
  }

  return "default"
}
