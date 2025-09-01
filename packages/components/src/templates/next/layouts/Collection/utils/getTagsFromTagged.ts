import { ArticlePagePageProps, CollectionPagePageProps } from "~/types"

export const getTagsFromTagged = (
  tagged: NonNullable<ArticlePagePageProps["tagged"]>,
  tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]>,
): NonNullable<ArticlePagePageProps["tags"]> => {
  return tagCategories
    .map(({ options, label }) => {
      return {
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
