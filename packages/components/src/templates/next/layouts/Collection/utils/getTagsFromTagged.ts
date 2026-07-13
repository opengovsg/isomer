import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  TagGroup,
} from "~/types"

export const getTagsFromTagged = (
  tagged: NonNullable<ArticlePagePageProps["tagged"]>,
  tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]>,
): TagGroup[] => {
  return tagCategories
    .map(({ id, options, label }) => {
      return {
        id,
        category: label,
        selected: options
          .filter(({ id: optionId }) => tagged.includes(optionId))
          .map(({ label }) => label),
      }
    })
    .filter(({ selected }) => {
      return selected.length > 0
    })
}
