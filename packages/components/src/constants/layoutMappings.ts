import type { IsomerPageLayoutType } from "~/types"

export const LAYOUT_MAPPINGS: Record<
  Exclude<IsomerPageLayoutType, "file" | "link">,
  string
> = {
  article: "ArticleLayout",
  collection: "CollectionLayout",
  content: "ContentLayout",
  database: "DatabaseLayout",
  homepage: "HomepageLayout",
  index: "IndexPageLayout",
  notfound: "NotFoundLayout",
  search: "SearchLayout",
} as const
