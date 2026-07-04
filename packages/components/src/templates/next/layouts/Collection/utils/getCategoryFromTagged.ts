import type { ArticlePagePageProps, CollectionPagePageProps } from "~/types"

// The last tagCategories group is the item's "category" for display purposes
// (e.g. Article Layout, Collection Card, Collection Block) — the migrated
// legacy `category` field always lands there, since the migration script
// appends its "Category" group to the end of `tagCategories`. Multiple
// selected options within that group are joined with a comma.
export const getCategoryFromTagged = (
  tagged: ArticlePagePageProps["tagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
): string | undefined => {
  const lastTagCategory = tagCategories?.at(-1)
  if (!lastTagCategory || !tagged) {
    return undefined
  }

  const labels = lastTagCategory.options
    .filter(({ id }) => tagged.includes(id))
    .map(({ label }) => label)

  return labels.length > 0 ? labels.join(", ") : undefined
}
