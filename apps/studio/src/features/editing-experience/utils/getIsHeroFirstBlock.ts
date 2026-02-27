import type {
  ISOMER_PAGE_LAYOUTS,
  IsomerSchema,
} from "@opengovsg/isomer-components"

// NOTE: Because we migrate from GitHub to Studio and also because our
// underlying data structure is just JSON, it's not guaranteed that our
// `RootPage` will always have a hero banner as the first block
export const getIsHeroFirstBlock = (
  pageLayout: (typeof ISOMER_PAGE_LAYOUTS)[keyof typeof ISOMER_PAGE_LAYOUTS],
  pageContent: IsomerSchema,
) =>
  pageLayout === "homepage" &&
  pageContent.content.length > 0 &&
  pageContent.content[0]?.type === "hero"
