import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  TagGroup,
} from "~/types"

export const getTagsFromTagged = (
  tagged: NonNullable<ArticlePagePageProps["tagged"]>,
  tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]>,
): TagGroup[] => {
  const taggedSet = new Set(tagged)
  const tagGroups: TagGroup[] = []

  for (const { id, options, label } of tagCategories) {
    const selected: string[] = []

    for (const { id: optionId, label: optionLabel } of options) {
      if (taggedSet.has(optionId)) {
        selected.push(optionLabel)
      }
    }

    if (selected.length > 0) {
      tagGroups.push({
        category: label,
        id,
        selected,
      })
    }
  }

  return tagGroups
}
