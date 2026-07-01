import type { ArticlePagePageProps } from "@opengovsg/isomer-components"

import type { CollectionTags } from "../hooks/useCollectionTags"

export function validateRequiredTags(
  tags: CollectionTags,
  tagged: ArticlePagePageProps["tagged"],
) {
  const unfilledRequiredCategories = tags.filter(
    ({ isRequired, options }) =>
      isRequired &&
      options.length > 0 &&
      !options.some(({ id }) => tagged?.includes(id)),
  )

  return {
    unfilledRequiredCategories,
    isValid: unfilledRequiredCategories.length === 0,
  }
}
