import type { ArticlePagePageProps } from "@opengovsg/isomer-components"
import { isDateFilter } from "@opengovsg/isomer-components"

import type { CollectionTags } from "../hooks/useCollectionTags"

// Mirrors validateRequiredTags, but for date filters: `isRequired` is
// satisfied by the item having a `dateTagged` entry (with a `date`
// filled in) for that filter's id, rather than a `tagged` option id.
export function validateRequiredDateFilters(
  tags: CollectionTags,
  dateTagged: ArticlePagePageProps["dateTagged"],
) {
  const unfilledRequiredDateFilters = tags
    .filter(isDateFilter)
    .filter(
      ({ id, isRequired }) =>
        isRequired &&
        !dateTagged?.some((value) => value.id === id && value.date),
    )

  return {
    unfilledRequiredDateFilters,
    isValid: unfilledRequiredDateFilters.length === 0,
  }
}
