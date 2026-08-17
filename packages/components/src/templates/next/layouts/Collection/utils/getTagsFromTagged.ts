import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  TagGroup,
} from "~/types"
import { isTextFilter } from "~/types/page"

export const getTagsFromTagged = (
  tagged: NonNullable<ArticlePagePageProps["tagged"]>,
  tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]>,
): TagGroup[] => {
  return (
    tagCategories
      // NOTE: date filters have no `options`/`tagged` membership — they resolve
      // their own tags separately (see getDateFilterValues).
      .filter(isTextFilter)
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
  )
}
