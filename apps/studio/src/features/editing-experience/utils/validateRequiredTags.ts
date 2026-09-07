import type { ArticlePagePageProps } from "@opengovsg/isomer-components"
import { isNonEmptyArray, isNullableBooleanTrue } from "~/utils/truthiness"

import type { CollectionTags } from "../hooks/useCollectionTags"

export const validateRequiredTags = (
  tags: CollectionTags,
  tagged: ArticlePagePageProps["tagged"] = [],
) => {
  // oxlint-disable-next-line unicorn/no-useless-collection-argument -- core cleanup deferred
  const taggedSet = new Set(tagged ?? [])
  const unfilledRequiredCategories = tags.filter(
    ({ isRequired, options }) =>
      isNullableBooleanTrue(isRequired) &&
      isNonEmptyArray(options) &&
      !options.some(({ id }) => taggedSet.has(id)),
  )

  return {
    isValid: unfilledRequiredCategories.length === 0,
    unfilledRequiredCategories,
  }
}
